import ICharacterClassRepository from '../../../../domain/repositories/ICharacterClassRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import SkillService from '../../../../domain/services/skill.service';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import ISubclassRepository from '../../../../domain/repositories/ISubclassRepository';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import AttributeService from '../../../../domain/services/attribute.service';
import { ChoiceApi, ChoiceMongo } from '../../../../domain/types';
import {
  CharacterClassApi,
  CharacterClassLevelInput,
  CharacterClassLevelMongo,
  CharacterClassMongo,
  ClaseLevelUp,
  InputCreateCharacterClass,
  InputUpdateCharacterClass,
  SpellcastingLevelSource,
  SubclassChoiceMenuApi
} from '../../../../domain/types/characterClass.types';
import { ChoiceSpell } from '../../../../domain/types/spell.types';
import { DoteApi } from '../../../../domain/types/dotes.types';
import { EquipmentApi, EquipmentOptionsMongo, EquipmentChoiceMongo, ResolvedEquipmentChoiceApi } from '../../../../domain/types/equipment.types';
import { AttributeApi } from '../../../../domain/types/attribute.types';
import { TraitApi, TraitDataMongo } from '../../../../domain/types/traits.types';
import { SubclassApi } from '../../../../domain/types/subclass.types';
import mongoose from 'mongoose';
import CharacterClassModel from '../schemas/CharacterClass';
import { NotFoundError } from '../../../../domain/errors/AppError';
import {
  buildCantripSpellChoice,
  buildSynthesizedKnownSpellChoice,
  hasCantripSpellChoice,
  remainingCantripPicks,
  resolveClassSpellSlotsForLevel,
} from '../../../../utils/characterSpellcasting';

export default class CharacterClassRepository implements ICharacterClassRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly skillService?: SkillService,
    private readonly proficiencyRepository?: IProficiencyRepository,
    private readonly equipmentRepository?: IEquipmentRepository,
    private readonly traitRepository?: ITraitRepository,
    private readonly spellRepository?: ISpellRepository,
    private readonly doteRepository?: IDoteRepository,
    private readonly invocationRepository?: IInvocacionRepository,
    private readonly languageRepository?: ILanguageRepository,
    private readonly attributeService?: AttributeService,
    private readonly subclassRepository?: ISubclassRepository
  ) { }

  async getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<CharacterClassApi[]> {
    try {
      const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
      const query: any = { ruleset: { $in: expandedRulesets } };
      if (!includeDeleted) {
        query.deletedAt = null;
      }
      const classes = await CharacterClassModel.find(query)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 })
        .lean<CharacterClassMongo[]>();

      return this.formatClasses(classes, expandedRulesets);
    } catch (error) {
      console.error("Error obteniendo clases:", error);
      throw new Error("No se pudieron obtener las clases");
    }
  }

  async getById(id: string): Promise<CharacterClassApi | null> {
    const doc = await CharacterClassModel.findById(id).lean<CharacterClassMongo>();
    if (!doc) return null;
    return this.formatClass(doc, doc.ruleset ? [doc.ruleset] : []);
  }

  async create(data: InputCreateCharacterClass): Promise<CharacterClassApi> {
    const newClass = new CharacterClassModel({
      ruleset: data.ruleset,
      name: data.name,
      description: data.description || [],
      img: data.img || "",
      hit_die: data.hit_die ?? 8,
      proficiencies: data.proficiencies ?? [],
      saving_throws: data.saving_throws ?? [],
      skill_choices: data.skill_choices ?? undefined,
      equipment: data.equipment ?? [],
      equipment_choices: data.equipment_choices ?? undefined,
      spellcasting: data.spellcasting ?? null,
      spellSaveDcFormula: data.spellSaveDcFormula,
      spellAttackBonusFormula: data.spellAttackBonusFormula,
      spellsPreparedFormula: data.spellsPreparedFormula,
      preparedFrom: data.preparedFrom,
      spellRepository: data.spellRepository ?? undefined,
      subclassChoice: data.subclassChoice ?? undefined,
      levels: this.mapLevelsForCreate(data.levels)
    });

    await newClass.save();
    return this.formatClass(newClass.toObject() as CharacterClassMongo, [data.ruleset]);
  }

  async update(data: InputUpdateCharacterClass): Promise<CharacterClassApi> {
    const { id, levels, ...updateFields } = data;

    if (updateFields.equipment_choices === null) {
      (updateFields as Record<string, unknown>).equipment_choices = [];
    }

    if (updateFields.equipment === null) {
      (updateFields as Record<string, unknown>).equipment = [];
    }

    if (updateFields.skill_choices === null) {
      (updateFields as Record<string, unknown>).skill_choices = undefined;
    }

    if (updateFields.spellRepository === null) {
      (updateFields as Record<string, unknown>).spellRepository = null;
    }

    if (updateFields.subclassChoice === null) {
      (updateFields as Record<string, unknown>).subclassChoice = null;
    }

    const setFields: Record<string, unknown> = { ...updateFields };

    if (levels !== undefined) {
      const existing = await CharacterClassModel.findById(id).lean<CharacterClassMongo>();
      if (!existing) {
        throw new NotFoundError(`No se encontró la clase con id: ${id}`);
      }
      setFields.levels = this.mergeLevels(existing.levels ?? [], levels);
    }

    const updatedClass = await CharacterClassModel.findByIdAndUpdate(
      id,
      { $set: setFields },
      { returnDocument: 'after' }
    ).lean<CharacterClassMongo>();

    if (!updatedClass) {
      throw new NotFoundError(`No se encontró la clase con id: ${id}`);
    }

    return this.formatClass(updatedClass, updatedClass.ruleset ? [updatedClass.ruleset] : []);
  }

  async softDelete(id: string): Promise<void> {
    await CharacterClassModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await CharacterClassModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async dataLevelUp(classId: string, level: number, subclasses: string[], rulesets: string[]): Promise<ClaseLevelUp | null> {
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return null;
    }
    const characterClass = await CharacterClassModel.findById(classId);

    if (!characterClass) {
      return null;
    }

    const hitDie = characterClass.hit_die ?? 8;
    const dataLevel = characterClass.levels?.find(data => data.level === level);
    const dataLevelOld = characterClass.levels?.find(data => data.level === level - 1);
    const {
      assigned: _assigned,
      subclassTraits,
      subclassTraitsData,
      subclassChoiceMenu
    } = await this.resolveSubclassLevelData(
      classId,
      level,
      subclasses,
      rulesets,
      characterClass.subclassChoice
    );

    if (!dataLevel) {
      return {
        hit_die: hitDie,
        traits: subclassTraits,
        traits_data: subclassTraitsData,
        subclassChoice: subclassChoiceMenu
      };
    }

    const traitsId: string[] = [];

    Object.keys(dataLevel?.traits_data ?? {})?.forEach(t => {
      const data = dataLevel.traits_data[t];
      const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null;

      if (this.numericValuesDiffer(data, dataOld)) {
        traitsId.push(t);
      }
    });

    traitsId.push(...(dataLevel?.traits ?? []));

    const uniqueTraitIds = [...new Set(traitsId)];
    const traits = this.traitRepository
      ? await this.traitRepository.getTraitsByIndexes(uniqueTraitIds, dataLevel?.traits_data)
      : [];

    let feats: ChoiceApi<DoteApi> | undefined = undefined;

    if (dataLevel.ability_score && this.doteRepository) {
      feats = await this.doteRepository.formatearOpcionesDeDote(1);
    }

    const spell_choices = this.spellRepository ? await this.spellRepository.formatSpellChoices(dataLevel?.spell_choices) : undefined;
    const spell_changes_aux = this.spellRepository ? await this.spellRepository.formatSpellChoices(dataLevel?.spell_changes?.options) : undefined;

    const spell_changes = Array.from({ length: dataLevel?.spell_changes?.number ?? 0 }, () => spell_changes_aux?.map(opt => ({ ...opt })) ?? []);

    const skill_choices = this.skillService ? await this.skillService.formatSkillChoices(dataLevel.skill_choices) : undefined;
    const invocations_choices = this.invocationRepository ? await this.invocationRepository.obtenerOpciones(dataLevel.invocations ?? 0) : undefined;
    const invocations_change = this.invocationRepository ? await this.invocationRepository.obtenerOpciones(dataLevel.invocations_change ?? 0) : undefined;

    const spells = dataLevel?.spell_group?.class && this.spellRepository
      ? await this.spellRepository.getSpellsByLevelAndClass(
          dataLevel.spell_group.level ?? 0,
          [],
          dataLevel.spell_group.class
        )
      : [];

    let traits_options = undefined;

    if (dataLevel?.traits_options && this.traitRepository) {
      const traitsAux = await this.traitRepository.getTraitsByIndexes(dataLevel?.traits_options?.options ?? []);
      traits_options = {
        ...dataLevel.traits_options,
        options: traitsAux
      };
    }

    return {
      hit_die: hitDie,
      traits: [...traits, ...subclassTraits],
      traits_data: { ...(dataLevel.traits_data ?? {}), ...subclassTraitsData },
      traits_options,
      subclassChoice: subclassChoiceMenu,
      ability_score: dataLevel.ability_score,
      dotes: feats,
      double_skills: dataLevel.double_skills,
      spell_choices,
      spells,
      spell_changes,
      skill_choices,
      invocations_choices,
      invocations_change
    };
  }

  async getSpellcastingSources(classes: { id: string, level: number }[]): Promise<(SpellcastingLevelSource | null)[]> {
    const validObjectIds = classes
      .map(characterClass => characterClass.id)
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validObjectIds.length === 0) return [];

    const classDocs = await CharacterClassModel.find({ _id: { $in: validObjectIds } }).lean<CharacterClassMongo[]>();

    return Promise.all(classDocs.map(classDoc => this.getSpellcastingSource(classDoc, classes)));
  }

  private async getSpellcastingSource(characterClass: CharacterClassMongo, classLevels: { id: string, level: number }[]): Promise<SpellcastingLevelSource | null> {
    const level = classLevels.find(classLevel => classLevel.id === characterClass._id?.toString())?.level;

    if (!level) return null;

    const rawSpellcasting = resolveClassSpellSlotsForLevel(characterClass.levels ?? [], level);

    if (!rawSpellcasting) return null;

    const abilityKey = await this.resolveSpellcastingAbilityKey(characterClass.spellcasting, characterClass.ruleset || "");

    return {
      class: characterClass._id?.toString() || '',
      abilityKey,
      classLevel: level,
      slots: rawSpellcasting,
      spellSaveDcFormula: characterClass.spellSaveDcFormula,
      spellAttackBonusFormula: characterClass.spellAttackBonusFormula,
      spellsPreparedFormula: characterClass.spellsPreparedFormula,
      preparedFrom: characterClass.preparedFrom,
      ...(characterClass.spellRepository ? { spellRepository: characterClass.spellRepository } : {})
    };
  }

  private formatClasses(classes: CharacterClassMongo[], rulesets: string[]): Promise<CharacterClassApi[]> {
    return Promise.all(
      classes.map(characterClass => this.formatClass(characterClass, rulesets))
    );
  }

  private async formatClass(characterClass: CharacterClassMongo, rulesets: string[] = []): Promise<CharacterClassApi> {
    const dataLevel = characterClass?.levels?.find(level => level.level === 1);

    const [
      traits,
      proficiencies,
      proficiencies_choices,
      skill_choices,
      spells,
      spell_choices,
      equipment,
      equipment_choices,
      saving_throws,
      spellcasting
    ] = await Promise.all([
      this.traitRepository ? this.traitRepository.getTraitsByIndexes(dataLevel?.traits ?? [], dataLevel?.traits_data) : [],
      this.proficiencyRepository ? this.proficiencyRepository.getProficienciesByIndices([...characterClass.proficiencies ?? [], ...dataLevel?.proficiencies ?? []]) : [],
      this.proficiencyRepository ? this.proficiencyRepository.formatProficiencyChoices(characterClass?.proficiencies_choices ?? []) : [],
      this.skillService ? this.skillService.formatSkillChoices(characterClass.skill_choices) : undefined,
      dataLevel?.spell_group?.class && this.spellRepository
        ? this.spellRepository.getSpellsByLevelAndClass(
            dataLevel.spell_group.level ?? 0,
            [],
            dataLevel.spell_group.class
          )
        : [],
      this.spellRepository ? this.spellRepository.formatSpellChoices(dataLevel?.spell_choices) : undefined,
      this.equipmentRepository ? this.equipmentRepository.getCharacterEquipmentsByIds(characterClass?.equipment) : [],
      this.formatClassEquipmentChoices(characterClass?.equipment_choices, characterClass.ruleset || ""),
      this.formatSavingThrows(characterClass.saving_throws ?? [], characterClass.ruleset || ""),
      this.attributeService
        ? this.attributeService.formatSpellcastingAttribute(characterClass.spellcasting, characterClass.ruleset || "")
        : Promise.resolve(undefined)
    ]);

    const classId = characterClass._id ? characterClass._id.toString() : "";
    const hydrationRulesets = rulesets.length ? rulesets : (characterClass.ruleset ? [characterClass.ruleset] : []);
    const subclasses = classId && this.subclassRepository
      ? await this.subclassRepository.getByClassAndSystems(classId, hydrationRulesets)
      : [];
    const cantripCap = resolveClassSpellSlotsForLevel(characterClass.levels ?? [], 1)?.cantrips;
    const cantripPicks = remainingCantripPicks(cantripCap, 0);
    const synthesizedChoices: ChoiceMongo[] = [];

    if (
      cantripPicks > 0
      && classId
      && this.spellRepository
      && !hasCantripSpellChoice(dataLevel?.spell_choices)
    ) {
      synthesizedChoices.push(buildCantripSpellChoice(classId, cantripPicks));
    }

    const knownSpellChoice = this.spellRepository
      ? buildSynthesizedKnownSpellChoice(
        classId,
        characterClass.levels ?? [],
        1,
        dataLevel?.spell_choices
      )
      : undefined;
    if (knownSpellChoice) {
      synthesizedChoices.push(knownSpellChoice);
    }

    let resolvedSpellChoices = spell_choices;
    if (synthesizedChoices.length && this.spellRepository) {
      const synthesized = await this.spellRepository.formatSpellChoices(synthesizedChoices);
      if (synthesized?.length) {
        resolvedSpellChoices = [...synthesized, ...(spell_choices ?? [])];
      }
    }

    return {
      id: classId,
      ruleset: characterClass.ruleset || "",
      name: characterClass.name,
      description: characterClass?.description ?? [],
      hit_die: characterClass.hit_die ?? 8,
      img: characterClass.img || "",
      prof_bonus: 2,
      spellcasting,
      spellSaveDcFormula: characterClass.spellSaveDcFormula,
      spellAttackBonusFormula: characterClass.spellAttackBonusFormula,
      spellsPreparedFormula: characterClass.spellsPreparedFormula,
      preparedFrom: characterClass.preparedFrom,
      ...(characterClass.spellRepository ? { spellRepository: characterClass.spellRepository } : {}),
      ...(characterClass.subclassChoice ? { subclassChoice: characterClass.subclassChoice } : {}),
      subclasses,
      levels: this.toSlimLevels(characterClass.levels ?? []),
      proficiencies,
      proficiencies_choices,
      saving_throws,
      skill_choices,
      spells,
      spell_choices: resolvedSpellChoices,
      equipment,
      equipment_choices,
      traits,
      traits_data: dataLevel?.traits_data ?? {},
      deletedAt: characterClass.deletedAt
    };
  }

  private numericValuesDiffer(obj1: { [key: string]: string }, obj2: { [key: string]: string } | null): boolean {
    for (const key in obj1) {
      if (!obj2) {
        return true;
      } else if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }

  private async resolveSubclassLevelData(
    classId: string,
    level: number,
    subclassIds: string[],
    rulesets: string[],
    subclassChoice: CharacterClassMongo["subclassChoice"]
  ): Promise<{
    assigned: SubclassApi[];
    subclassTraits: TraitApi[];
    subclassTraitsData: TraitDataMongo;
    subclassChoiceMenu: SubclassChoiceMenuApi | null;
  }> {
    const assigned = this.subclassRepository
      ? (await this.subclassRepository.getByIds(subclassIds)).filter(item => item.classId === classId)
      : [];

    const subclassTraits: TraitApi[] = [];
    const subclassTraitsData: TraitDataMongo = {};

    for (const subclass of assigned) {
      const row = subclass.levels.find(item => item.level === level);
      if (!row) continue;
      subclassTraits.push(...row.traits);
      Object.assign(subclassTraitsData, row.traits_data ?? {});
    }

    const showMenu = Boolean(
      subclassChoice
      && level >= subclassChoice.level
      && assigned.length === 0
    );

    let subclassChoiceMenu: SubclassChoiceMenuApi | null = null;
    if (showMenu && subclassChoice && this.subclassRepository) {
      const options = await this.subclassRepository.getByClassAndSystems(
        classId,
        rulesets.length ? rulesets : []
      );
      subclassChoiceMenu = {
        name: subclassChoice.name,
        description: subclassChoice.description ?? [],
        level: subclassChoice.level,
        options
      };
    }

    return {
      assigned,
      subclassTraits,
      subclassTraitsData,
      subclassChoiceMenu
    };
  }

  private mapLevelsForCreate(levels?: CharacterClassLevelInput[]): CharacterClassLevelMongo[] {
    if (!levels?.length) return [];

    return levels.map(level => ({
      level: level.level,
      proficiencies: [],
      traits: level.traits ?? [],
      traits_data: {},
      spellcasting: level.spellcasting,
      ...(level.spell_choices !== undefined ? { spell_choices: level.spell_choices } : {})
    }));
  }

  private mergeLevels(
    existing: CharacterClassLevelMongo[],
    incoming: CharacterClassLevelInput[]
  ): CharacterClassLevelMongo[] {
    const byLevel = new Map<number, CharacterClassLevelMongo>();

    for (const row of existing) {
      byLevel.set(row.level, { ...row });
    }

    for (const row of incoming) {
      const current = byLevel.get(row.level);
      if (current) {
        byLevel.set(row.level, {
          ...current,
          spellcasting: row.spellcasting,
          ...(row.spell_choices !== undefined ? { spell_choices: row.spell_choices } : {}),
          ...(row.traits !== undefined ? { traits: row.traits } : {})
        });
      } else {
        byLevel.set(row.level, {
          level: row.level,
          proficiencies: [],
          traits: row.traits ?? [],
          traits_data: {},
          spellcasting: row.spellcasting,
          ...(row.spell_choices !== undefined ? { spell_choices: row.spell_choices } : {})
        });
      }
    }

    return Array.from(byLevel.values()).sort((a, b) => a.level - b.level);
  }

  private toSlimLevels(levels: CharacterClassLevelMongo[]): CharacterClassLevelInput[] {
    return levels
      .map(level => {
        const slim: CharacterClassLevelInput = { level: level.level };

        if (level.spellcasting) {
          slim.spellcasting = level.spellcasting;
        }

        if (level.spell_choices !== undefined) {
          slim.spell_choices = level.spell_choices.map(choice => this.toSlimSpellChoice(choice));
        }

        if (level.traits?.length) {
          slim.traits = [...level.traits];
        }

        return slim;
      })
      .sort((a, b) => a.level - b.level);
  }

  private toSlimSpellChoice(choice: ChoiceMongo | ChoiceSpell): ChoiceMongo {
    if ("filter" in choice || "options" in choice) {
      const mongoChoice = choice as ChoiceMongo;
      return {
        choose: mongoChoice.choose,
        ...(mongoChoice.options !== undefined ? { options: mongoChoice.options } : {}),
        ...(mongoChoice.filter !== undefined ? { filter: mongoChoice.filter } : {})
      };
    }

    const legacy = choice as ChoiceSpell;
    const filter: Record<string, string | number | (string | number)[]> = {};
    if (legacy.level !== undefined) filter.level = legacy.level;
    if (legacy.class !== undefined) filter.classes = legacy.class;

    return {
      choose: legacy.choose,
      ...(Object.keys(filter).length > 0 ? { filter } : {})
    };
  }

  private async resolveSpellcastingAbilityKey(
    spellcasting: CharacterClassMongo["spellcasting"],
    ruleset: string
  ): Promise<string> {
    if (!spellcasting) return "";
    const attr = await this.attributeService?.formatSpellcastingAttribute(spellcasting, ruleset);
    if (attr?.key) return attr.key;
    return spellcasting.toString();
  }

  private async formatSavingThrows(keys: string[], ruleset: string): Promise<AttributeApi[]> {
    if (!keys.length || !this.attributeService || !ruleset) return [];

    const attributes = await this.attributeService.getBySystems([ruleset]);
    const byKey = new Map(attributes.map(attr => [attr.key, attr]));

    return keys
      .map(key => byKey.get(key))
      .filter((attr): attr is AttributeApi => attr !== undefined);
  }

  private async formatClassEquipmentChoices(
    rawChoices: unknown,
    ruleset: string
  ): Promise<ResolvedEquipmentChoiceApi[] | undefined> {
    if (!rawChoices || !Array.isArray(rawChoices) || rawChoices.length === 0) {
      return undefined;
    }

    if (!this.equipmentRepository) return undefined;

    if (Array.isArray(rawChoices[0])) {
      const legacyFormatted = await this.equipmentRepository.formatEquipmentChoices(
        rawChoices as EquipmentOptionsMongo[][]
      );

      if (!legacyFormatted) return undefined;

      return legacyFormatted.map(group => ({
        choose: group[0]?.choose ?? 1,
        options: group.flatMap(item => item.options) as EquipmentApi[],
        query_type: "options" as const
      }));
    }

    return this.equipmentRepository.formatEquipmentItemChoices(
      rawChoices as EquipmentChoiceMongo[],
      ruleset
    );
  }
}
