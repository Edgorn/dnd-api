import { Types } from "mongoose";
import IFeatRepository from "../../../../domain/repositories/IFeatRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import AttributeService from "../../../../domain/services/attribute.service";
import { ChoiceApi } from "../../../../domain/types";
import { AttributeApi } from "../../../../domain/types/attribute.types";
import {
  FeatApi,
  FeatMongo,
  FeatRequirements,
  FeatRequirementsCreate,
  InputCreateFeat,
  InputUpdateFeat
} from "../../../../domain/types/feat.types";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { ordenarPorNombre } from "../../../../utils/formatters";
import FeatSchema from "../schemas/Feat";

export default class FeatRepository implements IFeatRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly attributeService: AttributeService
  ) { }

  async create(data: InputCreateFeat): Promise<FeatApi> {
    try {
      const newFeat = new FeatSchema({
        name: data.name,
        description: data.description ?? [],
        summary: data.summary ?? [],
        ruleset: data.ruleset,
        requirements: this.normalizeRequirements(data.requirements)
      });

      await newFeat.save();
      return this.formatFeat(newFeat);
    } catch (error: unknown) {
      const mongoError = error as { code?: number };
      if (mongoError?.code === 11000) {
        throw new ConflictError("A feat with this name already exists");
      }
      throw error;
    }
  }

  async update(data: InputUpdateFeat): Promise<FeatApi> {
    const { id, ...updateFields } = data;
    if (updateFields.requirements) {
      updateFields.requirements = this.normalizeRequirements(updateFields.requirements);
    }

    const updatedFeat = await FeatSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: "after" }
    );

    if (!updatedFeat) {
      throw new NotFoundError(`No feat found with id: ${id}`);
    }

    return this.formatFeat(updatedFeat);
  }

  async getById(id: string): Promise<FeatApi | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const feat = await FeatSchema.findById(id);
    if (!feat) return null;
    return this.formatFeat(feat);
  }

  async getBySystems(rulesets: string[], userId?: string): Promise<FeatApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const rulesetQuery: Record<string, unknown> = { ruleset: { $in: expandedRulesets } };

    let includeDeleted = false;
    if (userId) {
      for (const ruleset of expandedRulesets) {
        const sys = await this.systemRepository.getById(ruleset);
        if (sys && sys.publisher === userId) {
          includeDeleted = true;
          break;
        }
      }
    }

    if (!includeDeleted) {
      rulesetQuery.deletedAt = null;
    }

    const feats = await FeatSchema.find(rulesetQuery)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<FeatMongo[]>();

    return ordenarPorNombre(await this.formatFeats(feats));
  }

  async getAll(): Promise<FeatApi[]> {
    const feats = await FeatSchema.find({ deletedAt: null })
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<FeatMongo[]>();

    return ordenarPorNombre(await this.formatFeats(feats));
  }

  async getFeatsByIds(ids: string[]): Promise<FeatApi[]> {
    const validIds = (ids || []).filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) return [];

    const feats = await FeatSchema.find({
      _id: { $in: validIds.map(id => new Types.ObjectId(id)) },
      deletedAt: null
    }).lean<FeatMongo[]>();

    return ordenarPorNombre(await this.formatFeats(feats));
  }

  async formatFeatChoices(count: number | undefined, ruleset?: string): Promise<ChoiceApi<FeatApi> | undefined> {
    if (count === undefined) return undefined;

    const options = ruleset
      ? await this.getBySystems([ruleset])
      : await this.getAll();

    return {
      choose: count,
      options,
      query_type: "all"
    };
  }

  async softDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await FeatSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await FeatSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await FeatSchema.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await FeatSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private normalizeRequirements(
    requirements?: FeatRequirementsCreate | null
  ): FeatRequirementsCreate | undefined {
    if (!requirements) return undefined;
    return {
      attributeMode: requirements.attributeMode ?? "all",
      attributes: requirements.attributes ?? []
    };
  }

  private async formatFeats(feats: FeatMongo[]): Promise<FeatApi[]> {
    const cache = new Map<string, Map<string, AttributeApi>>();
    const formatted: FeatApi[] = [];
    for (const feat of feats) {
      formatted.push(await this.formatFeat(feat, cache));
    }
    return formatted;
  }

  private async formatFeat(
    feat: FeatMongo,
    cache?: Map<string, Map<string, AttributeApi>>
  ): Promise<FeatApi> {
    const description = Array.isArray(feat.description) && feat.description.length > 0
      ? feat.description
      : (Array.isArray(feat.desc) ? feat.desc : []);
    const summary = Array.isArray(feat.summary) && feat.summary.length > 0
      ? feat.summary
      : description;

    return {
      id: feat._id.toString(),
      name: feat.name,
      description,
      summary,
      ruleset: feat.ruleset || "",
      requirements: await this.formatRequirements(feat, cache),
      deletedAt: feat.deletedAt
    };
  }

  private async formatRequirements(
    feat: FeatMongo,
    cache?: Map<string, Map<string, AttributeApi>>
  ): Promise<FeatRequirements> {
    const raw = feat.requirements;
    const rawAttributes = Array.isArray(raw?.attributes) ? raw.attributes : [];
    const attributeMap = await this.getAttributeMap(feat.ruleset || "", cache);

    return {
      attributeMode: raw?.attributeMode ?? "all",
      attributes: rawAttributes.map(requirement => {
        const attribute = attributeMap.get(requirement.key);
        return {
          key: requirement.key,
          name: attribute?.name || requirement.key,
          min: requirement.min,
          icon: attribute?.icon
        };
      })
    };
  }

  private async getAttributeMap(
    ruleset: string,
    cache?: Map<string, Map<string, AttributeApi>>
  ): Promise<Map<string, AttributeApi>> {
    if (cache?.has(ruleset)) {
      return cache.get(ruleset)!;
    }

    const attributes = ruleset
      ? await this.attributeService.getBySystems([ruleset])
      : [];
    const attributeMap = new Map<string, AttributeApi>();
    attributes.forEach(attribute => {
      attributeMap.set(attribute.key, attribute);
    });
    cache?.set(ruleset, attributeMap);
    return attributeMap;
  }
}
