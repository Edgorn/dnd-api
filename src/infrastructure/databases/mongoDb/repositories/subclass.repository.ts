import mongoose from "mongoose";
import ISubclassRepository from "../../../../domain/repositories/ISubclassRepository";
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import SkillService from "../../../../domain/services/skill.service";
import { NotFoundError } from "../../../../domain/errors/AppError";
import { ChoiceMongo } from "../../../../domain/types";
import { LevelSkillProficiencyChoice, SpellChoiceMongo } from "../../../../domain/types/classLevelChoices.types";
import {
  InputCreateSubclass,
  InputUpdateSubclass,
  SubclassApi,
  SubclassLevelApi,
  SubclassLevelInput,
  SubclassLevelMongo,
  SubclassMongo,
  SubclassSummaryDraft
} from "../../../../domain/types/subclass.types";
import SubclassModel from "../schemas/Subclass";

export default class SubclassRepository implements ISubclassRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly skillService: SkillService,
    private readonly spellRepository: ISpellRepository
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

  async getSummariesByClassAndSystems(classId: string, rulesets: string[]): Promise<SubclassSummaryDraft[]> {
    if (!classId || !rulesets.length) return [];

    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const docs = await SubclassModel.find({
      classId,
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    })
      .select("_id name img description ruleset classId")
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<Pick<SubclassMongo, "_id" | "name" | "img" | "description" | "ruleset" | "classId">[]>();

    return docs.map(doc => ({
      id: doc._id ? doc._id.toString() : "",
      name: doc.name,
      img: doc.img || "",
      description: doc.description ?? [],
      ruleset: doc.ruleset,
      classId: doc.classId
    }));
  }

  async countByClassIds(classIds: string[], rulesets: string[]): Promise<Map<string, number>> {
    const counts = new Map<string, number>();
    if (!classIds.length || !rulesets.length) return counts;

    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const rows = await SubclassModel.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          classId: { $in: classIds },
          ruleset: { $in: expandedRulesets },
          deletedAt: null
        }
      },
      { $group: { _id: "$classId", count: { $sum: 1 } } }
    ]);

    for (const row of rows) {
      counts.set(row._id, row.count);
    }
    return counts;
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
      levels: this.mapLevelsForCreate(data.levels),
      ...(data.expandedSpells?.length ? { expandedSpells: data.expandedSpells } : {})
    });

    await created.save();
    return this.formatSubclass(created.toObject() as SubclassMongo);
  }

  async update(data: InputUpdateSubclass): Promise<SubclassApi> {
    const { id, levels, expandedSpells, ...updateFields } = data;

    const setFields: Record<string, unknown> = { ...updateFields };
    const unsetFields: Record<string, 1> = {};

    if (expandedSpells === null) {
      unsetFields.expandedSpells = 1;
    } else if (expandedSpells !== undefined) {
      setFields.expandedSpells = expandedSpells;
    }

    if (levels !== undefined) {
      const existing = await SubclassModel.findById(id).lean<SubclassMongo>();
      if (!existing) {
        throw new NotFoundError("Subclase no encontrada");
      }
      setFields.levels = this.mergeLevels(existing.levels ?? [], levels);
    }

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys(setFields).length > 0) {
      updateQuery.$set = setFields;
    }
    if (Object.keys(unsetFields).length > 0) {
      updateQuery.$unset = unsetFields;
    }

    const updated = await SubclassModel.findByIdAndUpdate(
      id,
      updateQuery,
      { returnDocument: "after" }
    ).lean<SubclassMongo>();

    if (!updated) {
      throw new NotFoundError("Subclase no encontrada");
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
      .map(level => this.withSpellChoices(
        this.withSkillProficiencyChoices(
          this.withSkillChoices({
            level: level.level,
            traits: level.traits ?? [],
            traits_data: level.traits_data ?? {}
          }, level.skill_choices),
          level.skillProficiencyChoices
        ),
        level.spell_choices
      ))
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
      const withSkills = row.skill_choices === undefined
        ? base
        : this.withSkillChoices(base, row.skill_choices);
      const withProficiency = row.skillProficiencyChoices === undefined
        ? withSkills
        : this.withSkillProficiencyChoices(withSkills, row.skillProficiencyChoices);
      byLevel.set(
        row.level,
        row.spell_choices === undefined
          ? withProficiency
          : this.withSpellChoices(withProficiency, row.spell_choices)
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

  private withSkillProficiencyChoices(
    row: SubclassLevelMongo,
    skillProficiencyChoices?: LevelSkillProficiencyChoice | null
  ): SubclassLevelMongo {
    const next = { ...row };
    if (skillProficiencyChoices == null) {
      delete next.skillProficiencyChoices;
      return next;
    }
    next.skillProficiencyChoices = skillProficiencyChoices;
    return next;
  }

  private withSpellChoices(
    row: SubclassLevelMongo,
    spell_choices?: SpellChoiceMongo[] | null
  ): SubclassLevelMongo {
    const next = { ...row };
    if (spell_choices == null) {
      delete next.spell_choices;
      return next;
    }
    next.spell_choices = spell_choices;
    return next;
  }

  private formatSubclasses(docs: SubclassMongo[]): Promise<SubclassApi[]> {
    return Promise.all(docs.map(doc => this.formatSubclass(doc)));
  }

  private async formatSubclass(doc: SubclassMongo): Promise<SubclassApi> {
    const levels = await this.formatLevels(doc.levels ?? [], doc.ruleset);
    const expandedSpells = doc.expandedSpells?.length
      ? await this.spellRepository.getSpellsByIndexes(doc.expandedSpells)
      : [];

    return {
      id: doc._id ? doc._id.toString() : "",
      ruleset: doc.ruleset,
      classId: doc.classId,
      name: doc.name,
      description: doc.description ?? [],
      img: doc.img || "",
      levels,
      ...(expandedSpells.length ? { expandedSpells } : {}),
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
          ...(skill_choices ? { skill_choices } : {}),
          ...(level.skillProficiencyChoices ? { skillProficiencyChoices: level.skillProficiencyChoices } : {}),
          ...(level.spell_choices?.length ? { spell_choices: level.spell_choices } : {})
        };
      })
    );

    return formatted.sort((a, b) => a.level - b.level);
  }
}
