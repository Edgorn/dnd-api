import { DañoApi, RasgoApi, RasgoDataMongo, RasgoMongo } from "../../../../domain/types";

import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import IIdiomaRepository from "../../../../domain/repositories/IIdiomaRepository";
import IDañoRepository from "../../../../domain/repositories/IDañoRepository";
import DañoRepository from "./daño.repository";
import RasgoSchema from "../schemas/Rasgo";
import ICompetenciaRepository from "../../../../domain/repositories/ICompetenciaRepository";
import CompetenciaRepository from "./competencia.repository";
import ConjuroRepository from "./conjuros.repository";
import IEstadoRepository from "../../../../domain/repositories/IEstadoRepository";
import EstadoRepository from "./estado.repository";
import { TraitsOptionsApi, TraitsOptionsMongo } from "../../../../domain/types/rasgos";

export default class RasgoRepository extends IRasgoRepository {
  rasgosMap: {
    [key: string]: RasgoMongo/*{
      index: string,
      name: string,
      desc: string,
      discard?: string[],
      type?: string,
      languages: string[],
      resistances: DañoApi[],
      spells?: any[],
      skills?: string[],
      proficiencies?: string[],
      proficiencies_weapon?: string[],
      proficiencies_armor?: string[],
      speed?: number,
      hidden?: boolean,
      tables?: {
        title: string,
        data: {
          titles: string[],
          rows: string[][]
        }
      }[]
    }*/
  }

  dañoRepository: IDañoRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository
  estadoRepository: IEstadoRepository

  constructor(dañoRepository?: IDañoRepository, competenciaRepository?: ICompetenciaRepository, conjuroRepository?: IConjuroRepository) {
    super()
    this.rasgosMap = {}
    this.dañoRepository = dañoRepository ?? this.crearDañoRepositorioPorDefecto()
    this.competenciaRepository = competenciaRepository ?? this.crearCompetenciaRepositorioPorDefecto()
    this.conjuroRepository = conjuroRepository ?? this.crearConjuroRepositorioPorDefecto()
    this.estadoRepository = new EstadoRepository()
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

  async obtenerRasgosPorIndices(indices: string[], data: RasgoDataMongo = {}) {
    const resultados = await Promise.all(
      indices.map(index => this.obtenerRasgoPorIndice(index, data))
    )

    return resultados.filter(index => index !== null && index !== undefined);
  }

  async obtenerRasgoPorIndice(index: string, data: RasgoDataMongo = {}) {
    if (index) {
      if (this.rasgosMap[index]) {
        const rasgo = this.rasgosMap[index];
        const rasgoFormateado = await this.formatearRasgo(rasgo, data)

        return rasgoFormateado
      } else {
        const rasgo = await RasgoSchema.findOne({index});
        if (!rasgo) return null;

        const rasgoFormateado = await this.formatearRasgo(rasgo, data)

        this.rasgosMap[index] = rasgo

        return rasgoFormateado
      }
    } else {
      return null
    }
  }

  async formatearRasgo(rasgo: RasgoMongo, data: RasgoDataMongo = {}): Promise<RasgoApi> {
    const resistances = await this.dañoRepository.obtenerDañosPorIndices(rasgo.resistances ?? [])
    const conditional_resistances = await this.dañoRepository.obtenerDañosPorIndices(rasgo.conditional_resistances ?? [])
    const proficiencies_weapon = await this.competenciaRepository.obtenerCompetenciasPorIndices(rasgo?.proficiencies_weapon ?? [])
    const proficiencies_armor = await this.competenciaRepository.obtenerCompetenciasPorIndices(rasgo?.proficiencies_armor ?? [])
    const spells = await this.conjuroRepository.obtenerConjurosPorIndices(rasgo?.spells ?? [])

    const condition_inmunities = await this.estadoRepository.obtenerEstadosPorIndices(rasgo?.condition_inmunities)

    let desc = rasgo?.desc?.join("\n") ?? ''

    if (data) {
      const rasgoData = data[rasgo.index]

      if (rasgoData) {
        Object.keys(rasgoData).forEach(d => {
          desc = desc.replaceAll(d, rasgoData[d])
        })
      } 
    } 

    return {
      index: rasgo.index,
      name: rasgo.name,
      desc,
      hidden: rasgo?.hidden,
      discard: rasgo?.discard ?? [],
      resistances,
      conditional_resistances,
      condition_inmunities,
      proficiencies_weapon,
      proficiencies_armor,
      skills: rasgo?.skills ?? [],
      spells,
      speed: rasgo?.speed ?? undefined,
      //type: rasgo?.type,
      //languages: rasgo?.languages ?? [],
      //spells: this.conjuroRepository.obtenerConjurosPorIndices(rasgo.spells ?? []),
      //proficiencies: rasgo?.proficiencies ?? [],
      //tables: rasgo?.tables ?? []
    }
  }

  async formatearTraitsOptions(traitsOptions: TraitsOptionsMongo | undefined): Promise<TraitsOptionsApi | undefined> {
    if (!traitsOptions) return undefined;

    const options = await this.obtenerRasgosPorIndices(traitsOptions.options ?? []);
    return {
      ...traitsOptions,
      options
    };
  }
}
