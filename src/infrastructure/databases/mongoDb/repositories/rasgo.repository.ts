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
import { RasgoApi, RasgoDataMongo, RasgoMongo, TraitsOptionsApi, TraitsOptionsMongo } from "../../../../domain/types/rasgos.types";
import { ordenarPorNombre } from "../../../../utils/formatters";

export default class RasgoRepository implements IRasgoRepository {
  rasgosMap: { [key: string]: RasgoMongo }

  dañoRepository: IDañoRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository
  estadoRepository: IEstadoRepository

  constructor(dañoRepository?: IDañoRepository, competenciaRepository?: ICompetenciaRepository, conjuroRepository?: IConjuroRepository, estadoRepository?: IEstadoRepository) {
    this.rasgosMap = {}
    this.dañoRepository = dañoRepository ?? this.crearDañoRepositorioPorDefecto()
    this.competenciaRepository = competenciaRepository ?? this.crearCompetenciaRepositorioPorDefecto()
    this.conjuroRepository = conjuroRepository ?? this.crearConjuroRepositorioPorDefecto()
    this.estadoRepository = estadoRepository ?? this.crearEstadoRepositorioPorDefecto()
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
      const rasgos = await RasgoSchema.find({ index: { $in: missing } })
      rasgos.forEach(rasgo => (this.rasgosMap[rasgo.index] = rasgo));

      const rasgosFormateados = await this.formatearRasgos(rasgos)
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

  formatearRasgos(rasgos: RasgoMongo[], data: RasgoDataMongo = {}): Promise<RasgoApi[]> {
    return Promise.all(rasgos.map(rasgo => this.formatearRasgo(rasgo, data)))
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
}
