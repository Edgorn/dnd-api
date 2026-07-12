import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import IDañoRepository from "../../../../domain/repositories/IDañoRepository";
import TraitSchema from "../schemas/Trait";
import ICompetenciaRepository from "../../../../domain/repositories/ICompetenciaRepository";
import IEstadoRepository from "../../../../domain/repositories/IEstadoRepository";
import { CreateTrait, TraitApi, TraitDataMongo, TraitMongo, TraitsOptionsApi, TraitsOptionsMongo, UpdateTrait } from "../../../../domain/types/traits.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import { Types } from 'mongoose';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';

export default class TraitRepository implements ITraitRepository {
  constructor(
    private readonly dañoRepository: IDañoRepository,
    private readonly competenciaRepository: ICompetenciaRepository,
    private readonly conjuroRepository: IConjuroRepository,
    private readonly estadoRepository: IEstadoRepository,
    private readonly systemRepository: ISystemRepository
  ) {}

  async getBySystems(ruleset: string[]): Promise<TraitApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(ruleset);
    const traits = await TraitSchema.find({ ruleset: { $in: expandedRulesets }, deletedAt: null });
    return this.formatearTraits(traits, {});
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
    const traitUpdated = await TraitSchema.findByIdAndUpdate(
      trait.id,
      trait,
      { returnDocument: 'after' }
    );
    if (!traitUpdated) {
      throw new Error("Trait no encontrado");
    }
    return this.formatearTrait(traitUpdated, {});
  }

  async softDelete(id: string): Promise<void> {
    await TraitSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await TraitSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  private formatearTraits(traits: TraitMongo[], data: TraitDataMongo = {}): Promise<TraitApi[]> {
    return Promise.all(traits.map(trait => this.formatearTrait(trait, data)))
  }

  private async formatearTrait(trait: TraitMongo, data: TraitDataMongo = {}): Promise<TraitApi> {
    const resistances = await this.dañoRepository.obtenerDañosPorIndices(trait.resistances ?? [])
    const conditional_resistances = await this.dañoRepository.obtenerDañosPorIndices(trait.conditional_resistances ?? [])
    const proficiencies = await this.competenciaRepository.obtenerCompetenciasPorIndices([
      ...trait?.proficiencies_weapon ?? [],
      ...trait?.proficiencies_armor ?? [],
      ...trait?.proficiencies ?? []
    ])

    const spells = await this.conjuroRepository.obtenerConjurosPorIndices(trait?.spells ?? [])

    const condition_inmunities = await this.estadoRepository.obtenerEstadosPorIndices(trait?.condition_inmunities)
    let desc = [...trait?.desc ?? []];
    let description_aux = [...trait?.description ?? []];
    let summary_aux = [...trait?.summary ?? []];

    if (data) {
      const traitData = data[trait.index] ?? data[trait._id.toString()]

      if (traitData) {
        Object.keys(traitData).forEach(d => {
          desc.forEach((_, index) => {
            desc[index] = desc[index].replaceAll(d, traitData[d])
          })
          description_aux.forEach((_, index) => {
            description_aux[index] = description_aux[index].replaceAll(d, traitData[d])
          })
          summary_aux.forEach((_, index) => {
            summary_aux[index] = summary_aux[index].replaceAll(d, traitData[d])
          })
        })
      }
    }
 
    const description = (description_aux?.length ? description_aux : desc) ?? [];
    const summary = (summary_aux?.length ? summary_aux : description);

    const incompatible_traits = await this.getTraitsByIndexes(trait?.incompatible_traits ?? [])

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
      bonuses: trait?.bonuses ?? undefined,
      deletedAt: trait?.deletedAt ?? null
    }
  }
}
