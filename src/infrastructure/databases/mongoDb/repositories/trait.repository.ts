import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import IDañoRepository from "../../../../domain/repositories/IDañoRepository";
import TraitSchema from "../schemas/Trait";
import ICompetenciaRepository from "../../../../domain/repositories/ICompetenciaRepository";
import IEstadoRepository from "../../../../domain/repositories/IEstadoRepository";
import { CreateTrait, TraitApi, TraitDataMongo, TraitMongo, TraitsOptionsApi, TraitsOptionsMongo, UpdateTrait } from "../../../../domain/types/traits.types";
import { DañoApi } from "../../../../domain/types";
import { CompetenciaApi } from "../../../../domain/types/competencias.types";
import { ConjuroApi } from "../../../../domain/types/conjuros.types";
import { EstadoApi } from "../../../../domain/types/estados.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import { Types } from 'mongoose';
import { AppError } from '../../../../domain/errors/AppError';

export default class TraitRepository implements ITraitRepository {
  constructor(
    private readonly dañoRepository: IDañoRepository,
    private readonly competenciaRepository: ICompetenciaRepository,
    private readonly conjuroRepository: IConjuroRepository,
    private readonly estadoRepository: IEstadoRepository
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

  async getTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined> {
    if (!traitsOptions) return undefined;

    const options = await this.getTraitsByIndexes(traitsOptions.options ?? []);
    return {
      ...traitsOptions,
      options
    };
  }

  async getById(id: string): Promise<TraitApi | null> {
    const trait = await TraitSchema.findOne({ _id: id as any, deletedAt: null });
    if (!trait) return null;
    return this.formatearTrait(trait, {});
  }

  async create(trait: CreateTrait): Promise<TraitApi> {
    const traitCreated = await TraitSchema.create(trait);
    return this.formatearTrait(traitCreated, {});
  }

  async update(trait: UpdateTrait): Promise<TraitApi> {
    const { id, ...updateFields } = trait;
    const traitUpdated = await TraitSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    if (!traitUpdated) {
      throw new AppError("Trait no encontrado", 404);
    }
    return this.formatearTrait(traitUpdated, {});
  }

  async softDelete(id: string): Promise<void> {
    await TraitSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await TraitSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  private async formatearTraits(traits: TraitMongo[], data: TraitDataMongo = {}): Promise<TraitApi[]> {
    if (!traits.length) return [];

    const allResistances = new Set<string>();
    const allConditionalResistances = new Set<string>();
    const allProficiencies = new Set<string>();
    const allSpells = new Set<string>();
    const allConditionInmunities = new Set<string>();
    const allIncompatibleTraits = new Set<string>();

    for (const trait of traits) {
      (trait.resistances ?? []).forEach(r => allResistances.add(r));
      (trait.conditional_resistances ?? []).forEach(cr => allConditionalResistances.add(cr));
      [
        ...(trait.proficiencies_weapon ?? []),
        ...(trait.proficiencies_armor ?? []),
        ...(trait.proficiencies ?? [])
      ].forEach(p => allProficiencies.add(p));
      (trait.spells ?? []).forEach(s => allSpells.add(s));
      (trait.condition_inmunities ?? []).forEach(ci => allConditionInmunities.add(ci));
      (trait.incompatible_traits ?? []).forEach(it => allIncompatibleTraits.add(it));
    }

    const [
      fetchedResistances,
      fetchedConditionalResistances,
      fetchedProficiencies,
      fetchedSpells,
      fetchedConditionInmunities,
      fetchedIncompatibleTraits
    ] = await Promise.all([
      allResistances.size ? this.dañoRepository.obtenerDañosPorIndices(Array.from(allResistances)) : [],
      allConditionalResistances.size ? this.dañoRepository.obtenerDañosPorIndices(Array.from(allConditionalResistances)) : [],
      allProficiencies.size ? this.competenciaRepository.obtenerCompetenciasPorIndices(Array.from(allProficiencies)) : [],
      allSpells.size ? this.conjuroRepository.obtenerConjurosPorIndices(Array.from(allSpells)) : [],
      allConditionInmunities.size ? this.estadoRepository.obtenerEstadosPorIndices(Array.from(allConditionInmunities)) : [],
      allIncompatibleTraits.size ? this.getTraitsByIndexes(Array.from(allIncompatibleTraits)) : []
    ]);

    const resistanceMap = new Map<string, DañoApi>(fetchedResistances.map(item => [item.index, item]));
    const conditionalResistanceMap = new Map<string, DañoApi>(fetchedConditionalResistances.map(item => [item.index, item]));
    const proficiencyMap = new Map<string, CompetenciaApi>(fetchedProficiencies.map(item => [item.index, item]));
    const spellMap = new Map<string, ConjuroApi>(fetchedSpells.map(item => [(item as any).index ?? (item as any).id, item]));
    const conditionInmunityMap = new Map<string, EstadoApi>(fetchedConditionInmunities.map(item => [(item as any).index ?? (item as any).id, item]));
    const incompatibleTraitMap = new Map<string, TraitApi>(fetchedIncompatibleTraits.map(item => [item.id, item]));

    return traits.map(trait => {
      const resistances = (trait.resistances ?? [])
        .map(idx => resistanceMap.get(idx))
        .filter((item): item is DañoApi => !!item);

      const conditional_resistances = (trait.conditional_resistances ?? [])
        .map(idx => conditionalResistanceMap.get(idx))
        .filter((item): item is DañoApi => !!item);

      const proficienciesKeys = [
        ...(trait?.proficiencies_weapon ?? []),
        ...(trait?.proficiencies_armor ?? []),
        ...(trait?.proficiencies ?? [])
      ];
      const proficiencies = proficienciesKeys
        .map(idx => proficiencyMap.get(idx))
        .filter((item): item is CompetenciaApi => !!item);

      const spells = (trait.spells ?? [])
        .map(idx => spellMap.get(idx))
        .filter((item): item is ConjuroApi => !!item);

      const condition_inmunities = (trait.condition_inmunities ?? [])
        .map(idx => conditionInmunityMap.get(idx))
        .filter((item): item is EstadoApi => !!item);

      const incompatible_traits = (trait.incompatible_traits ?? [])
        .map(idx => incompatibleTraitMap.get(idx))
        .filter((item): item is TraitApi => !!item);

      let desc = [...(trait.desc ?? [])];
      let description_aux = [...(trait.description ?? [])];
      let summary_aux = [...(trait.summary ?? [])];

      if (data) {
        const traitData = data[trait.index] ?? data[trait._id.toString()];

        if (traitData) {
          Object.keys(traitData).forEach(d => {
            desc.forEach((_, index) => {
              desc[index] = desc[index].replaceAll(d, traitData[d]);
            });
            description_aux.forEach((_, index) => {
              description_aux[index] = description_aux[index].replaceAll(d, traitData[d]);
            });
            summary_aux.forEach((_, index) => {
              summary_aux[index] = summary_aux[index].replaceAll(d, traitData[d]);
            });
          });
        }
      }

      const description = (description_aux?.length ? description_aux : desc) ?? [];
      const summary = (summary_aux?.length ? summary_aux : description);

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
        skills: trait?.skills ?? [],
        spells,
        speed: trait?.speed ?? undefined,
        bonuses: trait?.bonuses ?? undefined
      };
    });
  }

  private async formatearTrait(trait: TraitMongo, data: TraitDataMongo = {}): Promise<TraitApi> {
    const result = await this.formatearTraits([trait], data);
    return result[0];
  }
}
