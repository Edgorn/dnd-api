import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import TraitSchema from "../schemas/Trait";
import IProficiencyRepository from "../../../../domain/repositories/IProficiencyRepository";
import IEstadoRepository from "../../../../domain/repositories/IEstadoRepository";
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import { SkillApi } from '../../../../domain/types/skill.types';
import { LanguageApi } from '../../../../domain/types/language.types';
import { ChoiceApi, ChoiceMongo } from "../../../../domain/types";
import { CreateTrait, TraitApi, TraitCatalogChoice, TraitDamageChoiceApi, TraitDataMongo, TraitLanguages, TraitMongo, TraitsOptionsApi, TraitsOptionsMongo, UpdateTrait } from "../../../../domain/types/traits.types";
import { Damage } from "../../../../domain/types";
import { ProficiencyApi } from '../../../../domain/types/proficiencies.types';
import { SpellApi } from "../../../../domain/types/spell.types";
import { EstadoApi } from "../../../../domain/types/estados.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import { normalizeTraitSpeed } from "../../../../utils/applyTraitSpeed";
import { Types } from 'mongoose';
import { AppError } from '../../../../domain/errors/AppError';

export default class TraitRepository implements ITraitRepository {
  constructor(
    private readonly damageRepository: IDamageRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly spellRepository: ISpellRepository,
    private readonly estadoRepository: IEstadoRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly languageRepository: ILanguageRepository
  ) {}

  async getBySystems(ruleset: string[]): Promise<TraitApi[]> {
    const traits = await TraitSchema.find({ ruleset: { $in: ruleset }, deletedAt: null });
    const traitsFormateados = await this.formatearTraits(traits, {});
    return ordenarPorNombre(traitsFormateados);
  }

  async getTraitsByIndexes(indices: string[], data: TraitDataMongo = {}): Promise<TraitApi[]> {
    if (!indices.length) return [];

    const validMongoIds = indices.filter(item => Types.ObjectId.isValid(item));
    const stringIndexes = indices.filter(item => !Types.ObjectId.isValid(item));

    const traits = await TraitSchema.find({
      deletedAt: null,
      $or: [
        { _id: { $in: validMongoIds } as any },
        { index: { $in: stringIndexes } }
      ]
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

  async getTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined> {
    if (!traitsOptions) return undefined;

    const options = await this.getTraitsByIndexes(traitsOptions.options ?? []);
    return {
      ...traitsOptions,
      options
    };
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
      throw new AppError("Trait no encontrado", 404);
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
      throw new AppError("Trait no encontrado", 404);
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

    for (const trait of traits) {
      (trait.resistances ?? []).forEach(r => allResistances.add(r));
      (trait.conditional_resistances ?? []).forEach(cr => allConditionalResistances.add(cr));
      (trait.proficiencies ?? []).forEach(p => allProficiencies.add(p));
      (trait.skills ?? []).forEach(s => allSkills.add(s));
      (trait.spells ?? []).forEach(s => allSpells.add(s));
      (trait.condition_inmunities ?? []).forEach(ci => allConditionInmunities.add(ci));
      (trait.incompatible_traits ?? []).forEach(it => allIncompatibleTraits.add(it));
      this.languageIds(trait.languages).forEach(id => allLanguages.add(id));
      this.damageChoiceTypeIds(trait).forEach(id => allChoiceDamages.add(id));
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
      fetchedChoiceDamages
    ] = await Promise.all([
      allResistances.size ? this.damageRepository.getByIds(Array.from(allResistances)) : [],
      allConditionalResistances.size ? this.damageRepository.getByIds(Array.from(allConditionalResistances)) : [],
      allProficiencies.size ? this.proficiencyRepository.getProficienciesByIndices(Array.from(allProficiencies)) : [],
      allSkills.size ? this.skillRepository.getSkillsByIndices(Array.from(allSkills)) : [],
      allSpells.size ? this.spellRepository.getSpellsByIndexes(Array.from(allSpells)) : [],
      allConditionInmunities.size ? this.estadoRepository.obtenerEstadosPorIndices(Array.from(allConditionInmunities)) : [],
      allIncompatibleTraits.size ? this.getTraitsByIndexes(Array.from(allIncompatibleTraits)) : [],
      allLanguages.size ? this.languageRepository.getLanguagesByIndex(Array.from(allLanguages)) : [],
      allChoiceDamages.size ? this.damageRepository.getByIds(Array.from(allChoiceDamages)) : []
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
    const spellMap = new Map<string, SpellApi>(fetchedSpells.map(item => [(item as any).index ?? (item as any).id, item]));
    const conditionInmunityMap = new Map<string, EstadoApi>(fetchedConditionInmunities.map(item => [(item as any).index ?? (item as any).id, item]));
    const incompatibleTraitMap = new Map<string, TraitApi>(fetchedIncompatibleTraits.map(item => [item.id, item]));
    const languageMap = new Map<string, LanguageApi>(fetchedLanguages.map(item => [item.id, item]));
    const choiceDamageMap = new Map<string, Damage>(fetchedChoiceDamages.map(item => [item.id!, item]));

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
        .filter((item): item is EstadoApi => !!item);

      const incompatible_traits = (trait.incompatible_traits ?? [])
        .map(idx => incompatibleTraitMap.get(idx))
        .filter((item): item is TraitApi => !!item);

      let description_aux = [...(trait.description ?? [])];
      let summary_aux = [...(trait.summary ?? [])];

      if (data) {
        const traitData = data[trait.index] ?? data[trait._id.toString()];

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
      const summary = (summary_aux?.length ? summary_aux : description);

      const skills = (trait.skills ?? [])
        .map(idx => skillMap.get(idx)?.id)
        .filter((item): item is string => !!item);

      return {
        id: trait.index ?? trait._id.toString(),
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
        proficiencies,
        skills,
        spells,
        speed: normalizeTraitSpeed(trait?.speed),
        bonuses: trait?.bonuses ?? undefined,
        acFormula: trait?.acFormula,
        suppressedByArmorTypeIds: trait?.suppressedByArmorTypeIds,
        ...(trait.equipmentRestriction ? { equipmentRestriction: trait.equipmentRestriction } : {}),
        ...(Array.isArray(trait.spellPrivileges) && trait.spellPrivileges.length
          ? { spellPrivileges: trait.spellPrivileges }
          : {}),
        ...(trait.companionRoster ? { companionRoster: trait.companionRoster } : {}),
        ...this.formatLanguages(trait.languages, languageMap),
        ...this.formatDamageChoices(trait, choiceDamageMap),
        ...this.formatCatalogChoices(trait),
        ...(trait.damageChoiceRef ? { damageChoiceRef: trait.damageChoiceRef } : {}),
        ...(trait.hitPoints ? { hitPoints: trait.hitPoints } : {})
      };
    });
  }

  private async formatearTrait(trait: TraitMongo, data: TraitDataMongo = {}): Promise<TraitApi> {
    const result = await this.formatearTraits([trait], data);
    return result[0];
  }

  private toMongooseWritePayload(trait: CreateTrait): Record<string, unknown> {
    const { acFormula, suppressedByArmorTypeIds, equipmentRestriction, languages, damageChoices, catalogChoices, damageChoiceRef, hitPoints, ...rest } = trait;
    return {
      ...rest,
      ...(typeof acFormula === "string" ? { acFormula } : {}),
      ...(Array.isArray(suppressedByArmorTypeIds) ? { suppressedByArmorTypeIds } : {}),
      ...(equipmentRestriction ? { equipmentRestriction } : {}),
      ...(languages ? { languages } : {}),
      ...(Array.isArray(damageChoices) ? { damageChoices } : {}),
      ...(Array.isArray(catalogChoices) ? { catalogChoices } : {}),
      ...(damageChoiceRef ? { damageChoiceRef } : {}),
      ...(hitPoints ? { hitPoints } : {})
    };
  }

  private toMongooseUpdateOperators(updateFields: Omit<UpdateTrait, "id">): {
    $set: Record<string, unknown>;
    $unset: Record<string, 1>;
  } {
    const {
      acFormula,
      suppressedByArmorTypeIds,
      equipmentRestriction,
      languages,
      damageChoices,
      catalogChoices,
      damageChoiceRef,
      hitPoints,
      ...rest
    } = updateFields;
    const $set: Record<string, unknown> = { ...rest };
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

    this.assignNullable($set, $unset, "equipmentRestriction", equipmentRestriction);
    this.assignNullable($set, $unset, "languages", languages);
    this.assignNullable($set, $unset, "damageChoices", damageChoices);
    this.assignNullable($set, $unset, "catalogChoices", catalogChoices);
    this.assignNullable($set, $unset, "damageChoiceRef", damageChoiceRef);
    this.assignNullable($set, $unset, "hitPoints", hitPoints);

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

  private formatCatalogChoices(
    trait: TraitMongo
  ): { catalogChoices: TraitCatalogChoice[] } | Record<string, never> {
    if (!Array.isArray(trait.catalogChoices)) return {};

    return {
      catalogChoices: trait.catalogChoices.map(choice => ({
        key: choice.key,
        options: (choice.options ?? [])
          .filter(option => typeof option?.name === "string" && option.name.length > 0)
          .map(option => ({ name: option.name })),
        grants: (choice.grants ?? [])
          .filter(grant => Number.isInteger(grant?.atLevel) && Number.isInteger(grant?.choose))
          .map(grant => ({ atLevel: grant.atLevel, choose: grant.choose }))
      }))
    };
  }

  private formatDamageChoices(
    trait: TraitMongo,
    damageMap: Map<string, Damage>
  ): { damageChoices: TraitDamageChoiceApi[] } | Record<string, never> {
    if (!Array.isArray(trait.damageChoices)) return {};

    return {
      damageChoices: trait.damageChoices.map(choice => ({
        key: choice.key,
        choose: choice.choose,
        options: (choice.options ?? []).map(option => {
          const damage = damageMap.get(option.damageTypeId);
          return {
            name: option.name,
            damageTypeId: option.damageTypeId,
            ...(damage ? { damage } : {})
          };
        })
      }))
    };
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
