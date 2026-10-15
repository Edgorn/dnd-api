import mongoose from "mongoose";
import ISubclassRepository from "../../../../domain/repositories/ISubclassRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import SkillService from "../../../../domain/services/skill.service";
import { NotFoundError } from "../../../../domain/errors/AppError";
import { ChoiceMongo } from "../../../../domain/types";
import {
  InputCreateSubclass,
  InputUpdateSubclass,
  SubclassApi,
  SubclassLevelApi,
  SubclassLevelInput,
  SubclassLevelMongo,
  SubclassMongo
} from "../../../../domain/types/subclass.types";
import SubclassModel from "../schemas/Subclass";

export default class SubclassRepository implements ISubclassRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly skillService: SkillService
  ) { }

  async getBySystems(rulesets: string[], classId?: string): Promise<SubclassApi[]> {
    if (!rulesets.length) return [];

    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const query: Record<string, unknown> = {
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    };
    if (classId) {
      query.classId = classId;
    }

    const docs = await SubclassModel.find(query)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<SubclassMongo[]>();

    return this.formatSubclasses(docs);
  }

  async getByClassAndSystems(classId: string, rulesets: string[]): Promise<SubclassApi[]> {
    if (!classId || !rulesets.length) return [];
    return this.getBySystems(rulesets, classId);
  }

  async getByIds(ids: string[]): Promise<SubclassApi[]> {
    const validIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
    if (!validIds.length) return [];

    const docs = await SubclassModel.find({
      _id: { $in: validIds },
      deletedAt: null
    }).lean<SubclassMongo[]>();

    return this.formatSubclasses(docs);
  }

  async getById(id: string): Promise<SubclassApi | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const doc = await SubclassModel.findById(id).lean<SubclassMongo>();
    if (!doc) return null;
    return this.formatSubclass(doc);
  }

  async create(data: InputCreateSubclass): Promise<SubclassApi> {
    const created = new SubclassModel({
      ruleset: data.ruleset,
      classId: data.classId,
      name: data.name,
      description: data.description ?? [],
      img: data.img ?? "",
      levels: this.mapLevelsForCreate(data.levels)
    });

    await created.save();
    return this.formatSubclass(created.toObject() as SubclassMongo);
  }

  async update(data: InputUpdateSubclass): Promise<SubclassApi> {
    const { id, levels, ...updateFields } = data;

    const setFields: Record<string, unknown> = { ...updateFields };

    if (levels !== undefined) {
      const existing = await SubclassModel.findById(id).lean<SubclassMongo>();
      if (!existing) {
        throw new NotFoundError(`No se encontró la subclase con id: ${id}`);
      }
      setFields.levels = this.mergeLevels(existing.levels ?? [], levels);
    }

    const updated = await SubclassModel.findByIdAndUpdate(
      id,
      { $set: setFields },
      { returnDocument: "after" }
    ).lean<SubclassMongo>();

    if (!updated) {
      throw new NotFoundError(`No se encontró la subclase con id: ${id}`);
    }

    return this.formatSubclass(updated);
  }

  async softDelete(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await SubclassModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await SubclassModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  private mapLevelsForCreate(levels?: SubclassLevelInput[]): SubclassLevelMongo[] {
    if (!levels?.length) return [];

    return levels
      .map(level => this.withSkillChoices({
        level: level.level,
        traits: level.traits ?? [],
        traits_data: level.traits_data ?? {}
      }, level.skill_choices))
      .sort((a, b) => a.level - b.level);
  }

  private mergeLevels(
    existing: SubclassLevelMongo[],
    incoming: SubclassLevelInput[]
  ): SubclassLevelMongo[] {
    const byLevel = new Map<number, SubclassLevelMongo>();

    for (const row of existing) {
      byLevel.set(row.level, { ...row, traits_data: { ...(row.traits_data ?? {}) } });
    }

    for (const row of incoming) {
      const current = byLevel.get(row.level);
      const base: SubclassLevelMongo = current
        ? {
          ...current,
          ...(row.traits !== undefined ? { traits: row.traits } : {}),
          ...(row.traits_data !== undefined ? { traits_data: row.traits_data } : {})
        }
        : {
          level: row.level,
          traits: row.traits ?? [],
          traits_data: row.traits_data ?? {}
        };
      byLevel.set(
        row.level,
        row.skill_choices === undefined ? base : this.withSkillChoices(base, row.skill_choices)
      );
    }

    return Array.from(byLevel.values()).sort((a, b) => a.level - b.level);
  }

  private withSkillChoices(
    row: SubclassLevelMongo,
    skill_choices?: ChoiceMongo | null
  ): SubclassLevelMongo {
    const next = { ...row };
    if (skill_choices == null) {
      delete next.skill_choices;
      return next;
    }
    next.skill_choices = skill_choices;
    return next;
  }

  private formatSubclasses(docs: SubclassMongo[]): Promise<SubclassApi[]> {
    return Promise.all(docs.map(doc => this.formatSubclass(doc)));
  }

  private async formatSubclass(doc: SubclassMongo): Promise<SubclassApi> {
    const levels = await this.formatLevels(doc.levels ?? [], doc.ruleset);

    return {
      id: doc._id ? doc._id.toString() : "",
      ruleset: doc.ruleset,
      classId: doc.classId,
      name: doc.name,
      description: doc.description ?? [],
      img: doc.img || "",
      levels,
      deletedAt: doc.deletedAt
    };
  }

  private async formatLevels(levels: SubclassLevelMongo[], ruleset: string): Promise<SubclassLevelApi[]> {
    const formatted = await Promise.all(
      levels.map(async level => {
        const traits = await this.traitRepository.getTraitsByIndexes(
          level.traits ?? [],
          level.traits_data ?? {}
        );
        const skill_choices = await this.skillService.formatSkillChoices(level.skill_choices, ruleset);

        return {
          level: level.level,
          traits,
          traits_data: level.traits_data ?? {},
          ...(skill_choices ? { skill_choices } : {})
        };
      })
    );

    return formatted.sort((a, b) => a.level - b.level);
  }
}
