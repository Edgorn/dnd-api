import { Types } from "mongoose";
import IOptionGroupRepository from "../../../../domain/repositories/IOptionGroupRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { NotFoundError } from "../../../../domain/errors/AppError";
import {
  InputCreateOptionGroup,
  InputUpdateOptionGroup,
  OptionGroupApi,
  OptionGroupMongo
} from "../../../../domain/types/optionGroup.types";
import OptionGroupSchema from "../schemas/OptionGroup";

export default class OptionGroupRepository implements IOptionGroupRepository {
  constructor(private readonly systemRepository: ISystemRepository) {}

  async create(data: InputCreateOptionGroup): Promise<OptionGroupApi> {
    const created = new OptionGroupSchema({
      ruleset: data.ruleset,
      name: data.name,
      description: data.description ?? []
    });
    await created.save();
    return this.format(created);
  }

  async update(data: InputUpdateOptionGroup): Promise<OptionGroupApi> {
    const { id, ...updateFields } = data;
    const setFields: Record<string, unknown> = {};
    if (updateFields.name !== undefined) setFields.name = updateFields.name;
    if (updateFields.description !== undefined) {
      setFields.description = updateFields.description ?? [];
    }

    const updated = await OptionGroupSchema.findByIdAndUpdate(
      id,
      { $set: setFields },
      { returnDocument: "after" }
    );

    if (!updated) {
      throw new NotFoundError("Grupo de opciones no encontrado");
    }

    return this.format(updated);
  }

  async getBySystems(rulesets: string[], expandAncestry: boolean = true): Promise<OptionGroupApi[]> {
    const expandedRulesets = expandAncestry
      ? await this.systemRepository.getSystemsAndAncestors(rulesets)
      : rulesets;
    const docs = await OptionGroupSchema.find({
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    }).lean<OptionGroupMongo[]>();
    return docs.map(doc => this.format(doc));
  }

  async getByIds(ids: string[]): Promise<OptionGroupApi[]> {
    const validIds = [...new Set(ids.filter(id => Types.ObjectId.isValid(id)))];
    if (!validIds.length) return [];

    const docs = await OptionGroupSchema.find({
      _id: { $in: validIds },
      deletedAt: null
    }).lean<OptionGroupMongo[]>();

    return docs.map(doc => this.format(doc));
  }

  async getById(id: string): Promise<OptionGroupApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await OptionGroupSchema.findById(id).lean<OptionGroupMongo>();
    if (!doc) return null;
    return this.format(doc);
  }

  async softDelete(id: string): Promise<void> {
    await OptionGroupSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await OptionGroupSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await OptionGroupSchema.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await OptionGroupSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private format(doc: OptionGroupMongo): OptionGroupApi {
    return {
      id: doc._id.toString(),
      ruleset: doc.ruleset,
      name: doc.name,
      description: doc.description ?? [],
      deletedAt: doc.deletedAt ?? null
    };
  }
}
