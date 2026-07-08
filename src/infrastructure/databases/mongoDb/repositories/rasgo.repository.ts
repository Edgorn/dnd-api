import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import IDañoRepository from "../../../../domain/repositories/IDañoRepository";
import DañoRepository from "./daño.repository";
import RasgoSchema from "../schemas/Rasgo";
import ICompetenciaRepository from "../../../../domain/repositories/ICompetenciaRepository";
import CompetenciaRepository from "./competencia.repository";
import ConjuroRepository from "./conjuros.repository";
import IEstadoRepository from "../../../../domain/repositories/IEstadoRepository";
import EstadoRepository from "./estado.repository";
import { CreateRasgo, RasgoApi, RasgoDataMongo, RasgoMongo, TraitsOptionsApi, TraitsOptionsMongo, UpdateRasgo } from "../../../../domain/types/rasgos.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import { Types } from 'mongoose';

import ISystemRepository from '../../../../domain/repositories/ISystemRepository';

export default class RasgoRepository implements IRasgoRepository {
  rasgosMap: { [key: string]: RasgoMongo }

  dañoRepository: IDañoRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository
  estadoRepository: IEstadoRepository
  systemRepository?: ISystemRepository

  constructor(
    dañoRepository?: IDañoRepository,
    competenciaRepository?: ICompetenciaRepository,
    conjuroRepository?: IConjuroRepository,
    estadoRepository?: IEstadoRepository,
    systemRepository?: ISystemRepository
  ) {
    this.rasgosMap = {}
    this.dañoRepository = dañoRepository ?? this.crearDañoRepositorioPorDefecto()
    this.competenciaRepository = competenciaRepository ?? this.crearCompetenciaRepositorioPorDefecto()
    this.conjuroRepository = conjuroRepository ?? this.crearConjuroRepositorioPorDefecto()
    this.estadoRepository = estadoRepository ?? this.crearEstadoRepositorioPorDefecto()
    this.systemRepository = systemRepository
  }

  private crearDañoRepositorioPorDefecto(): IDañoRepository {
    return new DañoRepository();
  }

  private crearCompetenciaRepositorioPorDefecto(): ICompetenciaRepository {
    return new CompetenciaRepository();
  }

  private crearConjuroRepositorioPorDefecto(): IConjuroRepository {
    return new ConjuroRepository();
  }

  private crearEstadoRepositorioPorDefecto(): IEstadoRepository {
    return new EstadoRepository();
  }

  async obtenerPorSistemas(ruleset: string[]): Promise<RasgoApi[]> {
    const expandedRulesets = this.systemRepository
      ? await this.systemRepository.getSystemsAndAncestors(ruleset)
      : ruleset;
    const rasgos = await RasgoSchema.find({ ruleset: { $in: expandedRulesets } })
    return this.formatearRasgos(rasgos, {});
  }

  async obtenerRasgosPorIndices(indices: string[], data: RasgoDataMongo = {}) {
    if (!indices.length) return [];

    const procesados = await Promise.all(indices.map(async (indice) => {
      if (this.rasgosMap[indice]) {
        const rasgo = await this.formatearRasgo(this.rasgosMap[indice], data);
        return { encontrado: rasgo };
      } else {
        return { faltante: indice };
      }
    }));

    const result = procesados
      .filter(p => p.encontrado)
      .map(p => p.encontrado!);

    const missing = procesados
      .filter(p => p.faltante)
      .map(p => p.faltante!);

    if (missing.length > 0) {
      const validMongoIds = missing.filter(item => Types.ObjectId.isValid(item));
      const stringIndexes = missing.filter(item => !Types.ObjectId.isValid(item));

      const rasgos = await RasgoSchema.find({
        $or: [
          { _id: { $in: validMongoIds } as any },
          { index: { $in: stringIndexes } }
        ]
      });

      rasgos.forEach(rasgo => (this.rasgosMap[rasgo.index] = rasgo));

      const rasgosFormateados = await this.formatearRasgos(rasgos, data)
      result.push(...rasgosFormateados);
    }

    return ordenarPorNombre(result);
  }

  async obtenerRasgosOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined> {
    if (!traitsOptions) return undefined;

    const options = await this.obtenerRasgosPorIndices(traitsOptions.options ?? []);
    return {
      ...traitsOptions,
      options
    };
  }

  async create(rasgo: CreateRasgo): Promise<RasgoApi> {
    const rasgoCreated = await RasgoSchema.create(rasgo);

    return this.formatearRasgo(rasgoCreated, {});
  }

  async update(rasgo: UpdateRasgo): Promise<RasgoApi> {
    const rasgoUpdated = await RasgoSchema.findByIdAndUpdate(rasgo.id, rasgo, { returnDocument: 'after' });
    if (!rasgoUpdated) {
      throw new Error("Rasgo no encontrado");
    }
    return this.formatearRasgo(rasgoUpdated, {});
  }

  private formatearRasgos(rasgos: RasgoMongo[], data: RasgoDataMongo = {}): Promise<RasgoApi[]> {
    return Promise.all(rasgos.map(rasgo => this.formatearRasgo(rasgo, data)))
  }

  private async formatearRasgo(rasgo: RasgoMongo, data: RasgoDataMongo = {}): Promise<RasgoApi> {
    const resistances = await this.dañoRepository.obtenerDañosPorIndices(rasgo.resistances ?? [])
    const conditional_resistances = await this.dañoRepository.obtenerDañosPorIndices(rasgo.conditional_resistances ?? [])
    const proficiencies = await this.competenciaRepository.obtenerCompetenciasPorIndices([
      ...rasgo?.proficiencies_weapon ?? [],
      ...rasgo?.proficiencies_armor ?? [],
      ...rasgo?.proficiencies ?? []
    ])

    const spells = await this.conjuroRepository.obtenerConjurosPorIndices(rasgo?.spells ?? [])

    const condition_inmunities = await this.estadoRepository.obtenerEstadosPorIndices(rasgo?.condition_inmunities)
    let desc = [...rasgo?.desc ?? []];
    let description_aux = [...rasgo?.description ?? []];
    let summary_aux = [...rasgo?.summary ?? []];

    if (data) {
      const rasgoData = data[rasgo.index] ?? data[rasgo._id.toString()]

      if (rasgoData) {
        Object.keys(rasgoData).forEach(d => {
          desc.forEach((_, index) => {
            desc[index] = desc[index].replaceAll(d, rasgoData[d])
          })
          description_aux.forEach((_, index) => {
            description_aux[index] = description_aux[index].replaceAll(d, rasgoData[d])
          })
          summary_aux.forEach((_, index) => {
            summary_aux[index] = summary_aux[index].replaceAll(d, rasgoData[d])
          })
        })
      }
    }
 
    const description = (description_aux?.length ? description_aux : desc) ?? [];
    const summary = (summary_aux?.length ? summary_aux : description);

    const incompatible_traits = await this.obtenerRasgosPorIndices(rasgo?.incompatible_traits ?? [])

    return {
      id: rasgo.index ?? rasgo._id.toString(),
      name: rasgo.name,
      description: description,
      summary: summary,
      ruleset: rasgo?.ruleset ?? "",
      incompatible_traits,
      hidden: rasgo?.hidden,
      discard: rasgo?.discard ?? [],
      resistances,
      conditional_resistances,
      condition_inmunities,
      proficiencies,
      skills: rasgo?.skills ?? [],
      spells,
      speed: rasgo?.speed ?? undefined,
      bonuses: rasgo?.bonuses ?? undefined,
      //type: rasgo?.type,
      //languages: rasgo?.languages ?? [],
      //spells: this.conjuroRepository.obtenerConjurosPorIndices(rasgo.spells ?? []),
      //proficiencies: rasgo?.proficiencies ?? [],
      //tables: rasgo?.tables ?? []
    }
  }
}
