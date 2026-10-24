import ICharacterClassRepository from '../../../../domain/repositories/ICharacterClassRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import SkillService from '../../../../domain/services/skill.service';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import ISubclassRepository from '../../../../domain/repositories/ISubclassRepository';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import AttributeService from '../../../../domain/services/attribute.service';
import { ChoiceApi, ChoiceMongo } from '../../../../domain/types';
import {
  LevelSkillProficiencyChoice,
  SpellChoiceMongo
} from '../../../../domain/types/classLevelChoices.types';
import {
  CharacterClassApi,
  CharacterClassCatalogItem,
  CharacterClassLevelInput,
  CharacterClassLevelMongo,
  CharacterClassMongo,
  CharacterClassSummaryChoice,
  CharacterClassSummaryDraft,
  ClaseLevelUp,
  InputCreateCharacterClass,
  InputUpdateCharacterClass,
  CharacterClassMulticlassApi,
  CharacterClassMulticlassCreate,
  SpellcastingLevelSource,
  SubclassChoiceMenuApi
} from '../../../../domain/types/characterClass.types';
import { AttributeRequirements, AttributeRequirementsCreate } from '../../../../domain/types/attributeRequirement.types';
import { ChoiceSpell } from '../../../../domain/types/spell.types';
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
  mergeClassSpellSlots,
  remainingCantripPicks,
  resolveClassSpellSlotsForLevel,
  resolveSlotProgressionForLevel,
} from '../../../../utils/characterSpellcasting';
import {
  hasAbilityScoreAtLevel,
  resolveAbilityScoreAlternativeGroupId,
  resolveAbilityScoreProgression
} from '../../../../utils/abilityScoreProgression';
import { mergeSkillChoices, mergeSkillProficiencyChoices } from '../../../../utils/characterMulticlass';
import { mergeOptionChoices } from '../../../../utils/characterOptionChoices';
import { SkillApi } from '../../../../domain/types/skill.types';
import { OptionChoiceMongo } from '../../../../domain/types/optionGroup.types';

export default class CharacterClassRepository implements ICharacterClassRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly skillService?: SkillService,
    private readonly proficiencyRepository?: IProficiencyRepository,
    private readonly equipmentRepository?: IEquipmentRepository,
    private readonly traitRepository?: ITraitRepository,
    private readonly spellRepository?: ISpellRepository,
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

  async getSummaries(rulesets: string[]): Promise<CharacterClassSummaryDraft[]> {
    if (!rulesets.length) return [];

    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const docs = await CharacterClassModel.find({
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    })
      .select("_id name description img ruleset hit_die spellcasting subclassChoice")
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<Pick<CharacterClassMongo, "_id" | "name" | "description" | "img" | "ruleset" | "hit_die" | "spellcasting" | "subclassChoice">[]>();

    return docs.map(doc => ({
      id: doc._id ? doc._id.toString() : "",
      name: doc.name,
      img: doc.img || "",
      description: doc.description ?? [],
      ruleset: doc.ruleset || "",
      hit_die: doc.hit_die ?? 8,
      hasSpellcasting: Boolean(doc.spellcasting),
      subclassChoice: this.toSummarySubclassChoice(doc.subclassChoice)
    }));
  }

  async getCatalog(rulesets: string[], includeMulticlass: boolean = false): Promise<CharacterClassCatalogItem[]> {
    if (!rulesets.length) return [];

    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const projection = includeMulticlass
      ? "_id name ruleset multiclass.requirements"
      : "_id name ruleset";
    const docs = await CharacterClassModel.find({
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    })
      .select(projection)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<Pick<CharacterClassMongo, "_id" | "name" | "ruleset" | "multiclass">[]>();

    const items: CharacterClassCatalogItem[] = [];
    for (const doc of docs) {
      const item: CharacterClassCatalogItem = {
        id: doc._id ? doc._id.toString() : "",
        name: doc.name,
        ruleset: doc.ruleset || ""
      };
      if (includeMulticlass && doc.multiclass?.requirements) {
        item.multiclass = {
          requirements: await this.formatMulticlassRequirements(
            doc.multiclass.requirements,
            doc.ruleset || ""
          )
        };
      }
      items.push(item);
    }
    return items;
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
      proficiencies_choices: data.proficiencies_choices ?? undefined,
      multiclass: this.normalizeMulticlass(data.multiclass),
      equipment: data.equipment ?? [],
      equipment_choices: data.equipment_choices ?? undefined,
      spellcasting: data.spellcasting ?? null,
      spellSaveDcFormula: data.spellSaveDcFormula,
      spellAttackBonusFormula: data.spellAttackBonusFormula,
      spellsPreparedFormula: data.spellsPreparedFormula,
      preparedFrom: data.preparedFrom,
      spellRepository: data.spellRepository ?? undefined,
      spellReplacement: data.spellReplacement ?? undefined,
      optionReplacements: data.optionReplacements ?? undefined,
      abilityScoreProgression: data.abilityScoreProgression ?? undefined,
      abilityScoreAlternativeGroupId: data.abilityScoreAlternativeGroupId ?? undefined,
      subclassChoice: data.subclassChoice ?? undefined,
      god: data.god ?? false,
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

    if (updateFields.proficiencies_choices === null) {
      (updateFields as Record<string, unknown>).proficiencies_choices = [];
    }

    if (updateFields.spellRepository === null) {
      (updateFields as Record<string, unknown>).spellRepository = null;
    }

    if (updateFields.spellReplacement === null) {
      (updateFields as Record<string, unknown>).spellReplacement = null;
    }

    if (updateFields.optionReplacements === null) {
      (updateFields as Record<string, unknown>).optionReplacements = null;
    }

    if (updateFields.subclassChoice === null) {
      (updateFields as Record<string, unknown>).subclassChoice = null;
    }

    if (updateFields.abilityScoreProgression === null) {
      (updateFields as Record<string, unknown>).abilityScoreProgression = null;
    }

    if (updateFields.abilityScoreAlternativeGroupId === null) {
      (updateFields as Record<string, unknown>).abilityScoreAlternativeGroupId = null;
    }

    const unsetFields: Record<string, 1> = {};
    if (updateFields.multiclass === null) {
      delete (updateFields as { multiclass?: unknown }).multiclass;
      unsetFields.multiclass = 1;
    } else if (updateFields.multiclass) {
      (updateFields as { multiclass?: CharacterClassMulticlassCreate }).multiclass =
        this.normalizeMulticlass(updateFields.multiclass);
    }

    const setFields: Record<string, unknown> = { ...updateFields };

    if (levels !== undefined) {
      const existing = await CharacterClassModel.findById(id).lean<CharacterClassMongo>();
      if (!existing) {
        throw new NotFoundError("Clase no encontrada");
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

    const updatedClass = await CharacterClassModel.findByIdAndUpdate(
      id,
      updateQuery,
      { returnDocument: 'after' }
    ).lean<CharacterClassMongo>();

    if (!updatedClass) {
      throw new NotFoundError("Clase no encontrada");
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
    const spellChoiceContext = {
      classId,
      levels: characterClass.levels ?? [],
      targetLevel: level
    };
    const {
      assigned: _assigned,
      subclassTraits,
      subclassTraitsData,
      subclassChoiceMenu,
      subclassSkillChoices,
      subclassSkillProficiencyChoices,
      subclassSpellChoices,
      subclassOptionChoices
    } = await this.resolveSubclassLevelData(
      classId,
      level,
      subclasses,
      rulesets,
      characterClass.subclassChoice
    );

    const abilityScore = await this.resolveLevelUpAbilityScore(
      characterClass,
      level,
      dataLevel?.ability_score
    );

    if (!dataLevel) {
      const spell_choices = this.spellRepository && subclassSpellChoices.length
        ? await this.spellRepository.formatSpellChoices(subclassSpellChoices, spellChoiceContext)
        : undefined;
      const skillProficiencyChoices = mergeSkillProficiencyChoices(
        ...subclassSkillProficiencyChoices
      );
      const optionChoices = mergeOptionChoices(subclassOptionChoices);
      return {
        hit_die: hitDie,
        traits: subclassTraits,
        traits_data: subclassTraitsData,
        subclassChoice: subclassChoiceMenu,
        ...(subclassSkillChoices ? { skill_choices: subclassSkillChoices } : {}),
        ...(skillProficiencyChoices.length ? { skillProficiencyChoices } : {}),
        ...(spell_choices?.length ? { spell_choices } : {}),
        ...(optionChoices.length ? { optionChoices } : {}),
        ...abilityScore
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

    const persistedSpellChoices = [
      ...(dataLevel?.spell_choices ?? []),
      ...subclassSpellChoices
    ];
    const spell_choices = this.spellRepository && persistedSpellChoices.length
      ? await this.spellRepository.formatSpellChoices(persistedSpellChoices, spellChoiceContext)
      : undefined;
    const spell_changes_aux = this.spellRepository ? await this.spellRepository.formatSpellChoices(dataLevel?.spell_changes?.options) : undefined;

    const spell_changes = Array.from({ length: dataLevel?.spell_changes?.number ?? 0 }, () => spell_changes_aux?.map(opt => ({ ...opt })) ?? []);

    const classSkillChoices = this.skillService
      ? await this.skillService.formatSkillChoices(dataLevel.skill_choices, characterClass.ruleset)
      : undefined;
    const skill_choices = mergeSkillChoices(classSkillChoices, subclassSkillChoices);
    const skillProficiencyChoices = mergeSkillProficiencyChoices(
      dataLevel.skillProficiencyChoices,
      ...subclassSkillProficiencyChoices
    );
    const optionChoices = mergeOptionChoices(dataLevel.optionChoices, subclassOptionChoices);

    const spells = dataLevel?.spell_group?.class && this.spellRepository
      ? await this.spellRepository.getSpellsByLevelAndClass(
          dataLevel.spell_group.level ?? 0,
          [],
          dataLevel.spell_group.class
        )
      : [];

    return {
      hit_die: hitDie,
      traits: [...traits, ...subclassTraits],
      traits_data: { ...(dataLevel.traits_data ?? {}), ...subclassTraitsData },
      subclassChoice: subclassChoiceMenu,
      ...abilityScore,
      spell_choices,
      spells,
      spell_changes,
      skill_choices,
      ...(skillProficiencyChoices.length ? { skillProficiencyChoices } : {}),
      ...(optionChoices.length ? { optionChoices } : {})
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

    const rawSpellcasting = mergeClassSpellSlots(
      resolveClassSpellSlotsForLevel(characterClass.levels ?? [], level),
      resolveSlotProgressionForLevel(characterClass.levels ?? [], level)
    );

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

  private async formatClass(characterClass: CharacterClassMongo, _rulesets: string[] = []): Promise<CharacterClassApi> {
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
      this.skillService ? this.skillService.formatSkillChoices(characterClass.skill_choices, characterClass.ruleset) : undefined,
      dataLevel?.spell_group?.class && this.spellRepository
        ? this.spellRepository.getSpellsByLevelAndClass(
            dataLevel.spell_group.level ?? 0,
            [],
            dataLevel.spell_group.class
          )
        : [],
      this.spellRepository ? this.spellRepository.formatSpellChoices(dataLevel?.spell_choices, {
        classId: characterClass._id ? characterClass._id.toString() : "",
        levels: characterClass.levels ?? [],
        targetLevel: 1
      }) : undefined,
      this.equipmentRepository ? this.equipmentRepository.getCharacterEquipmentsByIds(characterClass?.equipment) : [],
      this.formatClassEquipmentChoices(characterClass?.equipment_choices, characterClass.ruleset || ""),
      this.formatSavingThrows(characterClass.saving_throws ?? [], characterClass.ruleset || ""),
      this.attributeService
        ? this.attributeService.formatSpellcastingAttribute(characterClass.spellcasting, characterClass.ruleset || "")
        : Promise.resolve(undefined)
    ]);

    const classId = characterClass._id ? characterClass._id.toString() : "";
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
      ...(characterClass.spellReplacement ? { spellReplacement: characterClass.spellReplacement } : {}),
      ...(characterClass.optionReplacements?.length
        ? { optionReplacements: characterClass.optionReplacements }
        : {}),
      ...(Array.isArray(characterClass.abilityScoreProgression)
        ? { abilityScoreProgression: characterClass.abilityScoreProgression }
        : {}),
      ...(characterClass.abilityScoreAlternativeGroupId !== undefined
        ? { abilityScoreAlternativeGroupId: characterClass.abilityScoreAlternativeGroupId || null }
        : {}),
      ...(characterClass.subclassChoice ? { subclassChoice: characterClass.subclassChoice } : {}),
      levels: this.toSlimLevels(characterClass.levels ?? []),
      proficiencies,
      proficiencies_choices,
      saving_throws,
      skill_choices,
      spells,
      spell_choices: resolvedSpellChoices,
      equipment,
      equipment_choices,
      god: characterClass.god ?? false,
      traits,
      traits_data: dataLevel?.traits_data ?? {},
      deletedAt: characterClass.deletedAt,
      ...(await this.formatMulticlass(characterClass))
    };
  }

  private toSummarySubclassChoice(
    subclassChoice?: CharacterClassMongo["subclassChoice"]
  ): CharacterClassSummaryChoice | null {
    if (!subclassChoice?.name || !subclassChoice.level) return null;
    return { name: subclassChoice.name, level: subclassChoice.level };
  }

  private normalizeMulticlass(
    multiclass?: CharacterClassMulticlassCreate | null
  ): CharacterClassMulticlassCreate | undefined {
    if (!multiclass) return undefined;
    return {
      ...(multiclass.requirements
        ? {
            requirements: {
              attributeMode: multiclass.requirements.attributeMode ?? "all",
              attributes: multiclass.requirements.attributes ?? []
            }
          }
        : {}),
      ...(multiclass.proficiencies ? { proficiencies: multiclass.proficiencies } : {}),
      ...(multiclass.skill_choices ? { skill_choices: multiclass.skill_choices } : {}),
      ...(multiclass.proficiencies_choices
        ? { proficiencies_choices: multiclass.proficiencies_choices }
        : {})
    };
  }

  private async formatMulticlass(
    characterClass: CharacterClassMongo
  ): Promise<{ multiclass?: CharacterClassMulticlassApi }> {
    const raw = characterClass.multiclass;
    if (!raw) return {};

    const [proficiencies, skill_choices, proficiencies_choices, requirements] = await Promise.all([
      this.proficiencyRepository
        ? this.proficiencyRepository.getProficienciesByIndices(raw.proficiencies ?? [])
        : [],
      this.skillService ? this.skillService.formatSkillChoices(raw.skill_choices ?? undefined, characterClass.ruleset) : undefined,
      this.proficiencyRepository
        ? this.proficiencyRepository.formatProficiencyChoices(raw.proficiencies_choices ?? [])
        : [],
      this.formatMulticlassRequirements(raw.requirements, characterClass.ruleset || "")
    ]);

    return {
      multiclass: {
        requirements,
        proficiencies,
        skill_choices,
        proficiencies_choices: proficiencies_choices.length ? proficiencies_choices : undefined
      }
    };
  }

  private async formatMulticlassRequirements(
    requirements: AttributeRequirementsCreate | null | undefined,
    ruleset: string
  ): Promise<AttributeRequirements> {
    const rawAttributes = Array.isArray(requirements?.attributes) ? requirements.attributes : [];
    const attributes = ruleset && this.attributeService
      ? await this.attributeService.getBySystems([ruleset])
      : [];
    const attributeMap = new Map(attributes.map(attribute => [attribute.key, attribute]));

    return {
      attributeMode: requirements?.attributeMode ?? "all",
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
    subclassSkillChoices?: ChoiceApi<SkillApi>;
    subclassSkillProficiencyChoices: LevelSkillProficiencyChoice[];
    subclassSpellChoices: SpellChoiceMongo[];
    subclassOptionChoices: OptionChoiceMongo[];
  }> {
    const assigned = this.subclassRepository
      ? (await this.subclassRepository.getByIds(subclassIds)).filter(item => item.classId === classId)
      : [];

    const subclassTraits: TraitApi[] = [];
    const subclassTraitsData: TraitDataMongo = {};
    let subclassSkillChoices: ChoiceApi<SkillApi> | undefined;
    const subclassSkillProficiencyChoices: LevelSkillProficiencyChoice[] = [];
    const subclassSpellChoices: SpellChoiceMongo[] = [];
    const subclassOptionChoices: OptionChoiceMongo[] = [];

    for (const subclass of assigned) {
      const row = subclass.levels.find(item => item.level === level);
      if (!row) continue;
      subclassTraits.push(...row.traits);
      Object.assign(subclassTraitsData, row.traits_data ?? {});
      subclassSkillChoices = mergeSkillChoices(subclassSkillChoices, row.skill_choices);
      if (row.skillProficiencyChoices) {
        subclassSkillProficiencyChoices.push(row.skillProficiencyChoices);
      }
      if (row.spell_choices?.length) {
        subclassSpellChoices.push(...row.spell_choices);
      }
      if (row.optionChoices?.length) {
        subclassOptionChoices.push(...row.optionChoices);
      }
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
      subclassChoiceMenu,
      subclassSkillChoices,
      subclassSkillProficiencyChoices,
      subclassSpellChoices,
      subclassOptionChoices
    };
  }

  private async resolveLevelUpAbilityScore(
    characterClass: CharacterClassMongo,
    level: number,
    legacyFlag?: boolean
  ): Promise<{ ability_score?: boolean; abilityScoreAlternativeGroupId?: string }> {
    const ruleset = characterClass.ruleset;
    const rulesConfig = ruleset
      ? await this.systemRepository.getMergedRulesConfig([ruleset])
      : undefined;
    const resolved = resolveAbilityScoreProgression(
      characterClass.abilityScoreProgression,
      rulesConfig?.abilityScoreProgression
    );
    const ability_score = hasAbilityScoreAtLevel(level, resolved, legacyFlag);

    if (!ability_score) {
      return { ability_score: false };
    }

    const abilityScoreAlternativeGroupId = resolveAbilityScoreAlternativeGroupId(
      characterClass.abilityScoreAlternativeGroupId,
      rulesConfig?.abilityScoreAlternativeGroupId
    );

    return {
      ability_score: true,
      ...(abilityScoreAlternativeGroupId ? { abilityScoreAlternativeGroupId } : {})
    };
  }

  private mapLevelsForCreate(levels?: CharacterClassLevelInput[]): CharacterClassLevelMongo[] {
    if (!levels?.length) return [];

    return levels.map(level => this.withOptionChoices(
      this.withLevelSkillProficiencyChoices(
        this.withLevelSkillChoices({
          level: level.level,
          proficiencies: [],
          traits: level.traits ?? [],
          traits_data: level.traits_data ?? {},
          spellcasting: level.spellcasting,
          ...(level.spell_choices !== undefined ? { spell_choices: level.spell_choices } : {})
        }, level.skill_choices),
        level.skillProficiencyChoices
      ),
      level.optionChoices
    ));
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
      const base: CharacterClassLevelMongo = current
        ? {
          ...current,
          spellcasting: row.spellcasting,
          ...(row.spell_choices !== undefined ? { spell_choices: row.spell_choices } : {}),
          ...(row.traits !== undefined ? { traits: row.traits } : {}),
          ...(row.traits_data !== undefined ? { traits_data: row.traits_data } : {})
        }
        : {
          level: row.level,
          proficiencies: [],
          traits: row.traits ?? [],
          traits_data: row.traits_data ?? {},
          spellcasting: row.spellcasting,
          ...(row.spell_choices !== undefined ? { spell_choices: row.spell_choices } : {})
        };
      const withSkills = row.skill_choices === undefined
        ? base
        : this.withLevelSkillChoices(base, row.skill_choices);
      const withProficiency = row.skillProficiencyChoices === undefined
        ? withSkills
        : this.withLevelSkillProficiencyChoices(withSkills, row.skillProficiencyChoices);
      byLevel.set(
        row.level,
        row.optionChoices === undefined
          ? withProficiency
          : this.withOptionChoices(withProficiency, row.optionChoices)
      );
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

        if (level.traits_data && Object.keys(level.traits_data).length) {
          slim.traits_data = { ...level.traits_data };
        }

        if (level.skill_choices) {
          slim.skill_choices = { ...level.skill_choices };
        }

        if (level.skillProficiencyChoices) {
          slim.skillProficiencyChoices = { ...level.skillProficiencyChoices };
        }

        if (level.optionChoices?.length) {
          slim.optionChoices = [...level.optionChoices];
        }

        return slim;
      })
      .sort((a, b) => a.level - b.level);
  }

  private withLevelSkillChoices(
    row: CharacterClassLevelMongo,
    skill_choices?: ChoiceMongo | null
  ): CharacterClassLevelMongo {
    const next = { ...row };
    if (skill_choices == null) {
      delete next.skill_choices;
      return next;
    }
    next.skill_choices = skill_choices;
    return next;
  }

  private withOptionChoices(
    row: CharacterClassLevelMongo,
    optionChoices?: OptionChoiceMongo[] | null
  ): CharacterClassLevelMongo {
    const next = { ...row };
    if (optionChoices == null) {
      delete next.optionChoices;
      return next;
    }
    next.optionChoices = optionChoices;
    return next;
  }

  private withLevelSkillProficiencyChoices(
    row: CharacterClassLevelMongo,
    skillProficiencyChoices?: LevelSkillProficiencyChoice | null
  ): CharacterClassLevelMongo {
    const next = { ...row };
    if (skillProficiencyChoices == null) {
      delete next.skillProficiencyChoices;
      return next;
    }
    next.skillProficiencyChoices = skillProficiencyChoices;
    return next;
  }

  private toSlimSpellChoice(choice: SpellChoiceMongo | ChoiceSpell): SpellChoiceMongo {
    if ("filter" in choice || "options" in choice || "source" in choice || "levels" in choice) {
      const mongoChoice = choice as SpellChoiceMongo;
      return {
        choose: mongoChoice.choose,
        ...(mongoChoice.options !== undefined ? { options: mongoChoice.options } : {}),
        ...(mongoChoice.filter !== undefined ? { filter: mongoChoice.filter } : {}),
        ...(mongoChoice.source !== undefined ? { source: mongoChoice.source } : {}),
        ...(mongoChoice.levels !== undefined ? { levels: mongoChoice.levels } : {}),
        ...(mongoChoice.includeCantrips !== undefined ? { includeCantrips: mongoChoice.includeCantrips } : {}),
        ...(mongoChoice.countsTowardKnown !== undefined ? { countsTowardKnown: mongoChoice.countsTowardKnown } : {})
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
