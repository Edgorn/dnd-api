import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import TraitSchema from "../schemas/Trait";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import IConditionRepository from "../../../../domain/repositories/IConditionRepository";
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ICreatureTypeRepository from '../../../../domain/repositories/ICreatureTypeRepository';
import ICreatureRepository from '../../../../domain/repositories/ICreatureRepository';
import IAttributeRepository from '../../../../domain/repositories/IAttributeRepository';
import { SkillApi } from '../../../../domain/types/skill.types';
import { LanguageApi } from '../../../../domain/types/language.types';
import { ChoiceApi, ChoiceMongo } from "../../../../domain/types";
import { CreateTrait, TraitAction, TraitApi, TraitArea, TraitCatalogChoiceApi, TraitCatalogCreatureTypeRaces, TraitCatalogCreatureTypeRacesApi, TraitCatalogOption, TraitCatalogOptionApi, TraitCreatureFormExtension, TraitCreatureFormExtensionApi, TraitDamageChoiceApi, TraitDataMongo, TraitInnateSpellGrant, TraitInnateSpells, TraitInnateSpellsApi, TraitLanguages, TraitMongo, TraitUses, TraitWeaponDamageBonus, UpdateTrait, SPELL_PRIVILEGE_RECHARGES, TRAIT_ACTION_KINDS, TRAIT_ACTIVATIONS, TRAIT_AREA_SHAPES, TRAIT_DURATION_UNITS, TRAIT_WEAPON_DAMAGE_BONUS_WHENS } from "../../../../domain/types/traits.types";
import { AttributeApi } from "../../../../domain/types/attribute.types";
import { CreatureTypeApi } from "../../../../domain/types/creatureType.types";
import { Damage } from "../../../../domain/types";
import { ProficiencyApi } from '../../../../domain/types/proficiencies.types';
import { SpellApi } from "../../../../domain/types/spell.types";
import { CreatureApi } from "../../../../domain/types/creature.types";
import { formatCreatureFormPool } from "../../../../utils/creatureFormPool";
import { ConditionApi } from "../../../../domain/types/condition.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import { normalizeTraitSpeed } from "../../../../utils/applyTraitSpeed";
import { storedSummary, summaryToPersist } from "../../../../utils/traitSummary";
import { Types } from 'mongoose';
import { AppError } from '../../../../domain/errors/AppError';

export default class TraitRepository implements ITraitRepository {
  private creatureRepository?: ICreatureRepository;

  constructor(
    private readonly damageRepository: IDamageRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly spellRepository: ISpellRepository,
    private readonly conditionRepository: IConditionRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly creatureTypeRepository: ICreatureTypeRepository,
    private readonly attributeRepository: IAttributeRepository
  ) {}

  bindCreatureCatalog(creatureRepository: ICreatureRepository): void {
    this.creatureRepository = creatureRepository;
  }

  async getBySystems(ruleset: string[]): Promise<TraitApi[]> {
    const traits = await TraitSchema.find({ ruleset: { $in: ruleset }, deletedAt: null });
    const traitsFormateados = await this.formatearTraits(traits, {});
    return ordenarPorNombre(traitsFormateados);
  }

  async getTraitsByIndexes(indices: string[], data: TraitDataMongo = {}): Promise<TraitApi[]> {
    if (!indices.length) return [];

    const validMongoIds = indices.filter(item => Types.ObjectId.isValid(item));
    if (!validMongoIds.length) return [];

    const traits = await TraitSchema.find({
      deletedAt: null,
      _id: { $in: validMongoIds } as any
    });

    const traitsFormateados = await this.formatearTraits(traits, data);
    return ordenarPorNombre(traitsFormateados);
  }

  async formatTraitChoices(choices?: ChoiceMongo[]): Promise<ChoiceApi<TraitApi>[]> {
    if (!choices?.length) return [];

    const formatted = await Promise.all(
      choices.map(choice => this.formatTraitChoice(choice))
    );

    return formatted.filter((item): item is ChoiceApi<TraitApi> => item !== undefined);
  }

  async getById(id: string): Promise<TraitApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const trait = await TraitSchema.findOne({ _id: id as any, deletedAt: null });
    if (!trait) return null;
    return this.formatearTrait(trait, {});
  }

  async create(trait: CreateTrait): Promise<TraitApi> {
    const payload = this.toMongooseWritePayload(trait);
    const traitCreated = await TraitSchema.create(payload);
    return this.formatearTrait(traitCreated, {});
  }

  async update(trait: UpdateTrait): Promise<TraitApi> {
    const { id, ...updateFields } = trait;
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError("Rasgo no encontrado", 404);
    }
    const { $set, $unset } = this.toMongooseUpdateOperators(updateFields);
    const traitUpdated = await TraitSchema.findByIdAndUpdate(
      id,
      {
        ...(Object.keys($set).length ? { $set } : {}),
        ...(Object.keys($unset).length ? { $unset } : {})
      },
      { returnDocument: 'after' }
    );
    if (!traitUpdated) {
      throw new AppError("Rasgo no encontrado", 404);
    }
    return this.formatearTrait(traitUpdated, {});
  }

  async softDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await TraitSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await TraitSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  private async formatearTraits(traits: TraitMongo[], data: TraitDataMongo = {}): Promise<TraitApi[]> {
    if (!traits.length) return [];

    const allResistances = new Set<string>();
    const allConditionalResistances = new Set<string>();
    const allProficiencies = new Set<string>();
    const allSkills = new Set<string>();
    const allSpells = new Set<string>();
    const allConditionInmunities = new Set<string>();
    const allIncompatibleTraits = new Set<string>();
    const allLanguages = new Set<string>();
    const allChoiceDamages = new Set<string>();
    const allSaveAttributes = new Set<string>();
    const allCreatureTypes = new Set<string>();

    for (const trait of traits) {
      (trait.resistances ?? []).forEach(r => allResistances.add(r));
      (trait.conditional_resistances ?? []).forEach(cr => allConditionalResistances.add(cr));
      (trait.proficiencies ?? []).forEach(p => allProficiencies.add(p));
      (trait.skills ?? []).forEach(s => allSkills.add(s));
      (trait.spells ?? []).forEach(s => allSpells.add(s));
      (trait.condition_inmunities ?? []).forEach(ci => allConditionInmunities.add(ci));
      (trait.conditionalConditionImmunities ?? []).forEach(ci => allConditionInmunities.add(ci));
      (trait.incompatible_traits ?? []).forEach(it => allIncompatibleTraits.add(it));
      this.languageIds(trait.languages).forEach(id => allLanguages.add(id));
      this.damageChoiceTypeIds(trait).forEach(id => allChoiceDamages.add(id));
      this.saveAttributeIds(trait).forEach(id => allSaveAttributes.add(id));
      this.innateAbilityId(trait).forEach(id => allSaveAttributes.add(id));
      this.innateSpellIds(trait).forEach(id => allSpells.add(id));
      this.grantedSpellIds(trait).forEach(id => allSpells.add(id));
      this.extensionSpellIds(trait).forEach(id => allSpells.add(id));
      this.catalogCreatureTypeIds(trait).forEach(id => allCreatureTypes.add(id));
      this.extensionCreatureTypeIds(trait).forEach(id => allCreatureTypes.add(id));
    }

    const [
      fetchedResistances,
      fetchedConditionalResistances,
      fetchedProficiencies,
      fetchedSkills,
      fetchedSpells,
      fetchedConditionInmunities,
      fetchedIncompatibleTraits,
      fetchedLanguages,
      fetchedChoiceDamages,
      fetchedSaveAttributes,
      fetchedCreatureTypes,
      fetchedExtensionCreatures
    ] = await Promise.all([
      allResistances.size ? this.damageRepository.getByIds(Array.from(allResistances)) : [],
      allConditionalResistances.size ? this.damageRepository.getByIds(Array.from(allConditionalResistances)) : [],
      allProficiencies.size ? this.proficiencyRepository.getProficienciesByIndices(Array.from(allProficiencies)) : [],
      allSkills.size ? this.skillRepository.getSkillsByIndices(Array.from(allSkills)) : [],
      allSpells.size ? this.spellRepository.getSpellsByIndexes(Array.from(allSpells)) : [],
      allConditionInmunities.size ? this.conditionRepository.getByIds(Array.from(allConditionInmunities)) : [],
      allIncompatibleTraits.size ? this.getTraitsByIndexes(Array.from(allIncompatibleTraits)) : [],
      allLanguages.size ? this.languageRepository.getByIds(Array.from(allLanguages)) : [],
      allChoiceDamages.size ? this.damageRepository.getByIds(Array.from(allChoiceDamages)) : [],
      allSaveAttributes.size ? this.attributeRepository.getByIds(Array.from(allSaveAttributes)) : [],
      allCreatureTypes.size ? this.creatureTypeRepository.getByIds(Array.from(allCreatureTypes)) : [],
      this.loadExtensionCreatures(traits)
    ]);

    const resistanceMap = new Map<string, Damage>(fetchedResistances.map(item => [item.id!, item]));
    const conditionalResistanceMap = new Map<string, Damage>(fetchedConditionalResistances.map(item => [item.id!, item]));
    const proficiencyMap = new Map<string, ProficiencyApi>(fetchedProficiencies.map(item => [item.id, item]));
    const skillMap = new Map<string, SkillApi>();
    fetchedSkills.forEach(item => {
      skillMap.set(item.id, item);
      if (item.key) {
        skillMap.set(item.key, item);
      }
    });
    const spellMap = new Map<string, SpellApi>();
    fetchedSpells.forEach(item => {
      if (item.id) spellMap.set(item.id, item);
      const index = (item as { index?: string }).index;
      if (index) spellMap.set(index, item);
    });
    const conditionInmunityMap = new Map<string, ConditionApi>(fetchedConditionInmunities.map(item => [item.id, item]));
    const incompatibleTraitMap = new Map<string, TraitApi>(fetchedIncompatibleTraits.map(item => [item.id, item]));
    const languageMap = new Map<string, LanguageApi>(fetchedLanguages.map(item => [item.id, item]));
    const choiceDamageMap = new Map<string, Damage>(fetchedChoiceDamages.map(item => [item.id!, item]));
    const saveAttributeMap = new Map<string, AttributeApi>(fetchedSaveAttributes.map(item => [item.id, item]));
    const creatureTypeMap = new Map<string, CreatureTypeApi>(fetchedCreatureTypes.map(item => [item.id, item]));
    const creatureMap = new Map<string, CreatureApi>(fetchedExtensionCreatures.map(item => [item.id, item]));

    return traits.map(trait => {
      const resistances = (trait.resistances ?? [])
        .map(idx => resistanceMap.get(idx))
        .filter((item): item is Damage => !!item);

      const conditional_resistances = (trait.conditional_resistances ?? [])
        .map(idx => conditionalResistanceMap.get(idx))
        .filter((item): item is Damage => !!item);

      const proficienciesKeys = trait?.proficiencies ?? [];
      const proficiencies = proficienciesKeys
        .map(idx => proficiencyMap.get(idx))
        .filter((item): item is ProficiencyApi => !!item);

      const spells = (trait.spells ?? [])
        .map(idx => spellMap.get(idx))
        .filter((item): item is SpellApi => !!item);

      const condition_inmunities = (trait.condition_inmunities ?? [])
        .map(idx => conditionInmunityMap.get(idx))
        .filter((item): item is ConditionApi => !!item);

      const conditionalConditionImmunities = (trait.conditionalConditionImmunities ?? [])
        .map(idx => conditionInmunityMap.get(idx))
        .filter((item): item is ConditionApi => !!item);

      const incompatible_traits = (trait.incompatible_traits ?? [])
        .map(idx => incompatibleTraitMap.get(idx))
        .filter((item): item is TraitApi => !!item);

      let description_aux = [...(trait.description ?? [])];
      let summary_aux = [...(trait.summary ?? [])];

      if (data) {
        const traitData = data[trait._id.toString()];

        if (traitData) {
          Object.keys(traitData).forEach(d => {
            description_aux.forEach((_, index) => {
              description_aux[index] = description_aux[index].replaceAll(d, traitData[d]);
            });
            summary_aux.forEach((_, index) => {
              summary_aux[index] = summary_aux[index].replaceAll(d, traitData[d]);
            });
          });
        }
      }

      const description = description_aux ?? [];
      const summary = storedSummary(summary_aux);

      const skills = (trait.skills ?? [])
        .map(idx => skillMap.get(idx)?.id)
        .filter((item): item is string => !!item);

      return {
        id: trait._id.toString(),
        name: trait.name,
        description: description,
        summary: summary,
        ruleset: trait?.ruleset ?? "",
        incompatible_traits,
        hidden: trait?.hidden,
        discard: trait?.discard ?? [],
        resistances,
        conditional_resistances,
        condition_inmunities,
        ...(conditionalConditionImmunities.length ? { conditionalConditionImmunities } : {}),
        proficiencies,
        skills,
        spells,
        speed: normalizeTraitSpeed(trait?.speed),
        bonuses: trait?.bonuses ?? undefined,
        acFormula: trait?.acFormula,
        suppressedByArmorTypeIds: trait?.suppressedByArmorTypeIds,
        ignoresArmorSpeedPenaltyForTypeIds: trait?.ignoresArmorSpeedPenaltyForTypeIds,
        ...(trait.equipmentRestriction ? { equipmentRestriction: trait.equipmentRestriction } : {}),
        ...(Array.isArray(trait.spellPrivileges) && trait.spellPrivileges.length
          ? { spellPrivileges: trait.spellPrivileges }
          : {}),
        ...(trait.companionRoster ? { companionRoster: trait.companionRoster } : {}),
        ...this.formatLanguages(trait.languages, languageMap),
        ...this.formatDamageChoices(trait, choiceDamageMap, saveAttributeMap),
        ...this.formatCatalogChoices(trait, creatureTypeMap),
        ...(trait.damageChoiceRef ? { damageChoiceRef: trait.damageChoiceRef } : {}),
        ...(trait.hitPoints ? { hitPoints: trait.hitPoints } : {}),
        ...this.formatAction(trait.action),
        ...this.formatWeaponDamageBonus(trait.weaponDamageBonus),
        ...this.formatInnateSpells(trait.innateSpells, spellMap, saveAttributeMap),
        ...this.formatGrantedSpells(trait.grantedSpells, spellMap),
        ...this.formatCreatureFormExtensions(trait.creatureFormExtensions, spellMap, creatureMap, creatureTypeMap),
        ...(Array.isArray(trait.abilityScores) && trait.abilityScores.length
          ? { abilityScores: trait.abilityScores }
          : {}),
        ...(Array.isArray(trait.skillProficiencies) && trait.skillProficiencies.length
          ? { skillProficiencies: trait.skillProficiencies }
          : {}),
        ...(trait.stackGroup ? { stackGroup: trait.stackGroup } : {}),
        ...(trait.conditionalResistanceGroup ? { conditionalResistanceGroup: trait.conditionalResistanceGroup } : {})
      };
    });
  }

  private async formatearTrait(trait: TraitMongo, data: TraitDataMongo = {}): Promise<TraitApi> {
    const result = await this.formatearTraits([trait], data);
    return result[0];
  }

  private toMongooseWritePayload(trait: CreateTrait): Record<string, unknown> {
    const { acFormula, suppressedByArmorTypeIds, ignoresArmorSpeedPenaltyForTypeIds, equipmentRestriction, languages, damageChoices, catalogChoices, damageChoiceRef, hitPoints, action, weaponDamageBonus, innateSpells, grantedSpells, creatureFormExtensions, abilityScores, skillProficiencies, stackGroup, conditionalResistanceGroup, ...rest } = trait;
    return {
      ...rest,
      summary: summaryToPersist(trait.summary, trait.description),
      ...(typeof acFormula === "string" ? { acFormula } : {}),
      ...(Array.isArray(suppressedByArmorTypeIds) ? { suppressedByArmorTypeIds } : {}),
      ...(Array.isArray(ignoresArmorSpeedPenaltyForTypeIds) ? { ignoresArmorSpeedPenaltyForTypeIds } : {}),
      ...(equipmentRestriction ? { equipmentRestriction } : {}),
      ...(languages ? { languages } : {}),
      ...(Array.isArray(damageChoices) ? { damageChoices } : {}),
      ...(Array.isArray(catalogChoices) ? { catalogChoices } : {}),
      ...(damageChoiceRef ? { damageChoiceRef } : {}),
      ...(hitPoints ? { hitPoints } : {}),
      ...(action ? { action } : {}),
      ...(weaponDamageBonus ? { weaponDamageBonus } : {}),
      ...(innateSpells ? { innateSpells } : {}),
      ...(Array.isArray(grantedSpells) && grantedSpells.length ? { grantedSpells } : {}),
      ...(Array.isArray(creatureFormExtensions) && creatureFormExtensions.length
        ? { creatureFormExtensions }
        : {}),
      ...(Array.isArray(abilityScores) ? { abilityScores } : {}),
      ...(Array.isArray(skillProficiencies) ? { skillProficiencies } : {}),
      ...(stackGroup ? { stackGroup } : {}),
      ...(typeof conditionalResistanceGroup === "string" ? { conditionalResistanceGroup } : {})
    };
  }

  private toMongooseUpdateOperators(updateFields: Omit<UpdateTrait, "id">): {
    $set: Record<string, unknown>;
    $unset: Record<string, 1>;
  } {
    const {
      acFormula,
      suppressedByArmorTypeIds,
      ignoresArmorSpeedPenaltyForTypeIds,
      equipmentRestriction,
      languages,
      damageChoices,
      catalogChoices,
      damageChoiceRef,
      hitPoints,
      action,
      weaponDamageBonus,
      innateSpells,
      grantedSpells,
      creatureFormExtensions,
      abilityScores,
      skillProficiencies,
      stackGroup,
      conditionalResistanceGroup,
      ...rest
    } = updateFields;
    const $set: Record<string, unknown> = { ...rest };
    if (Array.isArray(rest.summary) && Array.isArray(rest.description)) {
      $set.summary = summaryToPersist(rest.summary, rest.description);
    }
    const $unset: Record<string, 1> = {};

    if (typeof acFormula === "string") {
      $set.acFormula = acFormula;
    } else if (acFormula === null) {
      $unset.acFormula = 1;
    }

    if (Array.isArray(suppressedByArmorTypeIds)) {
      $set.suppressedByArmorTypeIds = suppressedByArmorTypeIds;
    } else if (suppressedByArmorTypeIds === null) {
      $unset.suppressedByArmorTypeIds = 1;
    }

    if (Array.isArray(ignoresArmorSpeedPenaltyForTypeIds)) {
      $set.ignoresArmorSpeedPenaltyForTypeIds = ignoresArmorSpeedPenaltyForTypeIds;
    } else if (ignoresArmorSpeedPenaltyForTypeIds === null) {
      $unset.ignoresArmorSpeedPenaltyForTypeIds = 1;
    }

    this.assignNullable($set, $unset, "equipmentRestriction", equipmentRestriction);
    this.assignNullable($set, $unset, "languages", languages);
    this.assignNullable($set, $unset, "damageChoices", damageChoices);
    this.assignNullable($set, $unset, "catalogChoices", catalogChoices);
    this.assignNullable($set, $unset, "damageChoiceRef", damageChoiceRef);
    this.assignNullable($set, $unset, "hitPoints", hitPoints);
    this.assignNullable($set, $unset, "action", action);
    this.assignNullable($set, $unset, "weaponDamageBonus", weaponDamageBonus);
    this.assignNullable($set, $unset, "innateSpells", innateSpells);
    this.assignNullable($set, $unset, "grantedSpells", grantedSpells);
    this.assignNullable($set, $unset, "creatureFormExtensions", creatureFormExtensions);
    this.assignNullable($set, $unset, "abilityScores", abilityScores);
    this.assignNullable($set, $unset, "skillProficiencies", skillProficiencies);
    this.assignNullable($set, $unset, "stackGroup", stackGroup);
    this.assignNullable($set, $unset, "conditionalResistanceGroup", conditionalResistanceGroup);

    return { $set, $unset };
  }

  private assignNullable(
    $set: Record<string, unknown>,
    $unset: Record<string, 1>,
    key: string,
    value: unknown
  ): void {
    if (value === null) {
      $unset[key] = 1;
      return;
    }
    if (value !== undefined) {
      $set[key] = value;
    }
  }

  private languageIds(languages?: TraitLanguages): string[] {
    if (!languages || typeof languages !== "object") return [];
    return [...(languages.speaks ?? []), ...(languages.understands ?? [])]
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }

  private damageChoiceTypeIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.damageChoices)) return [];
    return trait.damageChoices.flatMap(choice =>
      (choice.options ?? [])
        .map(option => option.damageTypeId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    );
  }

  private saveAttributeIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.damageChoices)) return [];
    return trait.damageChoices.flatMap(choice =>
      (choice.options ?? [])
        .map(option => option.saveAttributeId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    );
  }

  private innateAbilityId(trait: TraitMongo): string[] {
    const abilityId = trait.innateSpells?.abilityId;
    return typeof abilityId === "string" && abilityId.length > 0 ? [abilityId] : [];
  }

  private innateSpellIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.innateSpells?.grants)) return [];
    return trait.innateSpells.grants
      .map(grant => grant.spellId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }

  private grantedSpellIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.grantedSpells)) return [];
    return trait.grantedSpells.filter((id): id is string => typeof id === "string" && id.length > 0);
  }

  private extensionSpellIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.creatureFormExtensions)) return [];
    return trait.creatureFormExtensions
      .map(extension => extension?.spellId)
      .filter((id): id is string => typeof id === "string" && id.length > 0);
  }

  private extensionCreatureTypeIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.creatureFormExtensions)) return [];
    return trait.creatureFormExtensions.flatMap(extension => {
      const pool = extension?.extraPool;
      if (!pool || pool.mode !== "filter") return [];
      return (pool.creatureTypeIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);
    });
  }

  private extensionCreatureIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.creatureFormExtensions)) return [];
    return trait.creatureFormExtensions.flatMap(extension => {
      const pool = extension?.extraPool;
      if (!pool || pool.mode !== "ids") return [];
      return (pool.creatureIds ?? []).filter((id): id is string => typeof id === "string" && id.length > 0);
    });
  }

  private async loadExtensionCreatures(traits: TraitMongo[]): Promise<CreatureApi[]> {
    const ids = [...new Set(traits.flatMap(trait => this.extensionCreatureIds(trait)))];
    if (!ids.length || !this.creatureRepository) return [];
    return this.creatureRepository.getByIds(ids);
  }

  private formatGrantedSpells(
    grantedSpells: string[] | undefined,
    spellMap: Map<string, SpellApi>
  ): { grantedSpells: SpellApi[] } | Record<string, never> {
    if (!Array.isArray(grantedSpells) || !grantedSpells.length) return {};
    const spells = grantedSpells
      .map(id => spellMap.get(id))
      .filter((item): item is SpellApi => Boolean(item));
    return spells.length ? { grantedSpells: spells } : {};
  }

  private formatCreatureFormExtensions(
    extensions: TraitCreatureFormExtension[] | undefined,
    spellMap: Map<string, SpellApi>,
    creatureMap: Map<string, CreatureApi>,
    typeMap: Map<string, CreatureTypeApi>
  ): { creatureFormExtensions: TraitCreatureFormExtensionApi[] } | Record<string, never> {
    if (!Array.isArray(extensions) || !extensions.length) return {};
    const formatted = extensions.flatMap(extension => {
      if (typeof extension?.spellId !== "string" || !extension.spellId || !extension.extraPool) return [];
      const item: TraitCreatureFormExtensionApi = {
        spellId: extension.spellId,
        extraPool: formatCreatureFormPool(extension.extraPool, creatureMap, typeMap)
      };
      const spell = spellMap.get(extension.spellId);
      if (spell) item.spell = spell;
      return [item];
    });
    return formatted.length ? { creatureFormExtensions: formatted } : {};
  }

  private formatLanguages(
    languages: TraitLanguages | undefined,
    languageMap: Map<string, LanguageApi>
  ): { languages: TraitApi["languages"] } | Record<string, never> {
    if (!languages || typeof languages !== "object") return {};

    const hydrate = (ids: string[] | undefined): LanguageApi[] =>
      (Array.isArray(ids) ? ids : [])
        .map(id => languageMap.get(id))
        .filter((item): item is LanguageApi => !!item);

    return {
      languages: {
        speaks: hydrate(languages.speaks),
        understands: hydrate(languages.understands)
      }
    };
  }

  private catalogCreatureTypeIds(trait: TraitMongo): string[] {
    if (!Array.isArray(trait.catalogChoices)) return [];
    return trait.catalogChoices.flatMap(choice => {
      const fromOptions = (choice.options ?? [])
        .map(option => option?.creatureTypeId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      const fromRules = (choice.creatureTypeRaces ?? [])
        .map(item => item?.creatureTypeId)
        .filter((id): id is string => typeof id === "string" && id.length > 0);
      return [...fromOptions, ...fromRules];
    });
  }

  private formatCatalogChoices(
    trait: TraitMongo,
    creatureTypes: Map<string, CreatureTypeApi>
  ): { catalogChoices: TraitCatalogChoiceApi[] } | Record<string, never> {
    if (!Array.isArray(trait.catalogChoices)) return {};

    return {
      catalogChoices: trait.catalogChoices.map(choice => ({
        key: choice.key,
        options: (choice.options ?? [])
          .filter(option => typeof option?.name === "string" && option.name.length > 0)
          .map(option => this.formatCatalogOption(option, creatureTypes)),
        grants: (choice.grants ?? [])
          .filter(grant => Number.isInteger(grant?.atLevel) && Number.isInteger(grant?.choose))
          .map(grant => ({ atLevel: grant.atLevel, choose: grant.choose })),
        ...(choice.language === "optional" || choice.language === "required"
          ? { language: choice.language }
          : {}),
        ...(choice.source === "creatureTypes" ? { source: choice.source } : {}),
        ...(Array.isArray(choice.creatureTypeRaces)
          ? { creatureTypeRaces: this.formatCreatureTypeRaces(choice.creatureTypeRaces, creatureTypes) }
          : {})
      }))
    };
  }

  private formatCreatureTypeRaces(
    items: TraitCatalogCreatureTypeRaces[],
    creatureTypes: Map<string, CreatureTypeApi>
  ): TraitCatalogCreatureTypeRacesApi[] {
    return items.flatMap(item => {
      if (typeof item?.creatureTypeId !== "string" || item.creatureTypeId.length === 0) return [];
      if (!Number.isInteger(item.races) || item.races < 1) return [];
      if (typeof item.label !== "string" || item.label.length === 0) return [];
      const formatted: TraitCatalogCreatureTypeRacesApi = {
        creatureTypeId: item.creatureTypeId,
        races: item.races,
        label: item.label
      };
      const creatureType = creatureTypes.get(item.creatureTypeId);
      if (creatureType) formatted.creatureType = creatureType;
      return [formatted];
    });
  }

  private formatCatalogOption(
    option: TraitCatalogOption,
    creatureTypes: Map<string, CreatureTypeApi>
  ): TraitCatalogOptionApi {
    const formatted: TraitCatalogOptionApi = { name: option.name };
    if (Number.isInteger(option.inputs) && (option.inputs ?? 0) > 0) formatted.inputs = option.inputs;
    if (option.repeatable === true) formatted.repeatable = true;
    if (typeof option.label === "string" && option.label.length > 0) formatted.label = option.label;
    if (typeof option.creatureTypeId === "string" && option.creatureTypeId.length > 0) {
      formatted.creatureTypeId = option.creatureTypeId;
      const creatureType = creatureTypes.get(option.creatureTypeId);
      if (creatureType) formatted.creatureType = creatureType;
    }
    if (Number.isInteger(option.races) && (option.races ?? 0) > 0) formatted.races = option.races;
    return formatted;
  }

  private formatDamageChoices(
    trait: TraitMongo,
    damageMap: Map<string, Damage>,
    attributeMap: Map<string, AttributeApi>
  ): { damageChoices: TraitDamageChoiceApi[] } | Record<string, never> {
    if (!Array.isArray(trait.damageChoices)) return {};

    return {
      damageChoices: trait.damageChoices.map(choice => ({
        key: choice.key,
        choose: choice.choose,
        options: (choice.options ?? []).map(option => {
          const damage = damageMap.get(option.damageTypeId);
          const area = this.formatStoredArea(option.area);
          const saveAttribute = option.saveAttributeId
            ? attributeMap.get(option.saveAttributeId)
            : undefined;
          return {
            name: option.name,
            damageTypeId: option.damageTypeId,
            ...(option.saveAttributeId ? { saveAttributeId: option.saveAttributeId } : {}),
            ...(damage ? { damage } : {}),
            ...(area ? { area } : {}),
            ...(saveAttribute ? { saveAttribute } : {})
          };
        })
      }))
    };
  }

  private formatStoredArea(area: TraitArea | undefined): TraitArea | undefined {
    if (!area || typeof area !== "object") return undefined;
    if (!TRAIT_AREA_SHAPES.includes(area.shape)) return undefined;
    if (typeof area.length !== "number") return undefined;
    if (area.unit !== "m" && area.unit !== "ft") return undefined;

    const formatted: TraitArea = {
      shape: area.shape,
      length: area.length,
      unit: area.unit
    };
    if (typeof area.width === "number") formatted.width = area.width;
    return formatted;
  }

  private formatInnateSpells(
    innateSpells: TraitInnateSpells | undefined,
    spellMap: Map<string, SpellApi>,
    attributeMap: Map<string, AttributeApi>
  ): { innateSpells: TraitInnateSpellsApi } | Record<string, never> {
    if (!innateSpells || typeof innateSpells !== "object") return {};
    if (typeof innateSpells.abilityId !== "string" || innateSpells.abilityId.length === 0) return {};
    if (!Array.isArray(innateSpells.grants) || innateSpells.grants.length === 0) return {};

    const grants = innateSpells.grants.flatMap(grant => {
      const formatted = this.formatInnateSpellGrant(grant, spellMap);
      return formatted ? [formatted] : [];
    });
    if (!grants.length) return {};

    const ability = attributeMap.get(innateSpells.abilityId);
    return {
      innateSpells: {
        abilityId: innateSpells.abilityId,
        ...(ability ? { ability } : {}),
        grants
      }
    };
  }

  private formatInnateSpellGrant(
    grant: TraitInnateSpellGrant,
    spellMap: Map<string, SpellApi>
  ): TraitInnateSpellsApi["grants"][number] | undefined {
    if (typeof grant?.spellId !== "string" || grant.spellId.length === 0) return undefined;
    if (!Number.isInteger(grant.atLevel) || grant.atLevel < 1) return undefined;
    const slotLevel = grant.slotLevel;
    const validSlotLevel = slotLevel === "spellLevel"
      || (typeof slotLevel === "number" && Number.isInteger(slotLevel) && slotLevel >= 1 && slotLevel <= 9);
    if (!validSlotLevel) return undefined;
    const uses = grant.uses;
    const validUses = uses === "unlimited" || (typeof uses === "number" && Number.isInteger(uses) && uses >= 1);
    if (!validUses) return undefined;
    const recharge = grant.recharge;
    const validRecharge = recharge === null || (SPELL_PRIVILEGE_RECHARGES as readonly string[]).includes(recharge ?? "");
    if (!validRecharge) return undefined;

    const spell = spellMap.get(grant.spellId);
    return {
      spellId: grant.spellId,
      atLevel: grant.atLevel,
      slotLevel,
      uses,
      recharge,
      ...(spell ? { spell } : {})
    };
  }

  private formatAction(action: TraitAction | undefined): { action: TraitAction } | Record<string, never> {
    if (!action || typeof action !== "object") return {};
    if (!TRAIT_ACTIVATIONS.includes(action.activation)) return {};

    const kind = TRAIT_ACTION_KINDS.includes(action.kind as typeof TRAIT_ACTION_KINDS[number])
      ? action.kind
      : "instant";
    const recharge = action.recharge;
    const validRecharge = recharge === null
      || recharge === "shortRest"
      || recharge === "longRest"
      || recharge === "shortOrLongRest";
    const usesByClassLevel = this.formatUsesByClassLevel(action.usesByClassLevel);
    const duration = this.formatDuration(action.duration);

    return {
      action: {
        activation: action.activation,
        kind,
        ...(action.deactivateActivation && TRAIT_ACTIVATIONS.includes(action.deactivateActivation)
          ? { deactivateActivation: action.deactivateActivation }
          : {}),
        ...(duration ? { duration } : {}),
        ...(typeof action.saveDcFormula === "string" && action.saveDcFormula.length > 0
          ? { saveDcFormula: action.saveDcFormula }
          : {}),
        ...(this.isTraitUses(action.uses) ? { uses: action.uses } : {}),
        ...(usesByClassLevel ? { usesByClassLevel } : {}),
        ...(validRecharge ? { recharge } : {})
      }
    };
  }

  private formatWeaponDamageBonus(
    bonus: TraitWeaponDamageBonus | undefined
  ): { weaponDamageBonus: TraitWeaponDamageBonus } | Record<string, never> {
    if (!bonus || typeof bonus !== "object") return {};
    if (!(TRAIT_WEAPON_DAMAGE_BONUS_WHENS as readonly string[]).includes(bonus.when)) return {};
    if (typeof bonus.melee !== "boolean") return {};

    const amountByClassLevel = this.formatAmountByClassLevel(bonus.amountByClassLevel);
    const abilityKeys = Array.isArray(bonus.abilityKeys)
      ? bonus.abilityKeys.filter(key => typeof key === "string" && key.length > 0)
      : [];
    const hasAmount = typeof bonus.amount === "number" && Number.isInteger(bonus.amount) && bonus.amount >= 1;
    if (!hasAmount && !amountByClassLevel) return {};

    return {
      weaponDamageBonus: {
        when: bonus.when,
        melee: bonus.melee,
        ...(abilityKeys.length ? { abilityKeys } : {}),
        ...(hasAmount ? { amount: bonus.amount } : {}),
        ...(amountByClassLevel ? { amountByClassLevel } : {})
      }
    };
  }

  private formatDuration(duration: TraitAction["duration"]): TraitAction["duration"] | undefined {
    if (!duration || typeof duration !== "object") return undefined;
    if (typeof duration.value !== "number" || duration.value <= 0) return undefined;
    if (!(TRAIT_DURATION_UNITS as readonly string[]).includes(duration.unit)) return undefined;
    return { value: duration.value, unit: duration.unit };
  }

  private isTraitUses(uses: TraitUses | undefined): uses is TraitUses {
    return uses === "unlimited" || (typeof uses === "number" && Number.isInteger(uses) && uses >= 1);
  }

  private formatUsesByClassLevel(
    map: TraitAction["usesByClassLevel"]
  ): TraitAction["usesByClassLevel"] | undefined {
    if (!map || typeof map !== "object") return undefined;
    const result: TraitAction["usesByClassLevel"] = {};
    for (const [key, value] of Object.entries(map)) {
      const level = Number(key);
      if (!Number.isInteger(level) || level < 1 || level > 20) continue;
      if (!this.isTraitUses(value)) continue;
      result[String(level)] = value;
    }
    return Object.keys(result).length ? result : undefined;
  }

  private formatAmountByClassLevel(
    map: Record<string, number> | undefined
  ): Record<string, number> | undefined {
    if (!map || typeof map !== "object") return undefined;
    const result: Record<string, number> = {};
    for (const [key, value] of Object.entries(map)) {
      const level = Number(key);
      if (!Number.isInteger(level) || level < 1 || level > 20) continue;
      if (typeof value !== "number" || !Number.isInteger(value) || value < 1) continue;
      result[String(level)] = value;
    }
    return Object.keys(result).length ? result : undefined;
  }

  private async formatTraitChoice(choice: ChoiceMongo | undefined): Promise<ChoiceApi<TraitApi> | undefined> {
    if (!choice?.options?.length) return undefined;

    const options = await this.getTraitsByIndexes(choice.options);
    return {
      choose: choice.choose,
      options,
      query_type: "options"
    };
  }
}
