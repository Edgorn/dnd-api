import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IRazaRepository from '../../../../domain/repositories/IRazaRepository';
import { RaceApi, RaceMongo, SubraceApi, SubraceMongo, TypeApi, TypeMongo } from '../../../../domain/types/razas';
import { formatearAbilityBonuses, formatearCompetencias, formatearOptions } from '../../../../utils/formatters';
const RazaSchema = require('../schemas/Raza');
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import DañoRepository from './daño.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';

export default class RazaRepository extends IRazaRepository {
  idiomaRepository: IIdiomaRepository
  rasgoRepository: IRasgoRepository
  dañoRepository: IDañoRepository
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository

  constructor() {
    super()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.rasgoRepository = new RasgoRepository(this.conjuroRepository)
    this.dañoRepository = new DañoRepository()
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
  }

  async obtenerTodas(): Promise<RaceApi[]> {
    const razas = await RazaSchema.find();

    return this.formatearRazas(razas)
  }

  async getRaza(index: string) {
    const raza = await RazaSchema.find({index});

    return raza[0] ?? null
  }

  formatearRazas(razas: RaceMongo[]): RaceApi[] {
    const formateadas = razas.map(raza => this.formatearRaza(raza))

    formateadas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return formateadas;
  } 

  formatearRaza(raza: RaceMongo): RaceApi {
    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      img: raza.img,
      speed: raza.speed,
      size: raza.size,
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses ?? []),
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(raza?.languages ?? []),
      traits: this.rasgoRepository.obtenerRasgosPorIndices(raza?.traits ?? []),
      options: formatearOptions(raza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      subraces: this.formatearSubrazas(raza?.subraces ?? [])
    };
  }

  formatearSubrazas(subrazas: SubraceMongo[]): SubraceApi[] {
    const formateadas = subrazas.map(raza => this.formatearSubraza(raza))

    formateadas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return formateadas;
  }

  formatearSubraza(subraza: SubraceMongo): SubraceApi {
    const traits = this.rasgoRepository.obtenerRasgosPorIndices(subraza?.traits ?? [])

    const traitsData = traits?.map(trait => {
      if (subraza?.traits_data) {
        const data = subraza?.traits_data[trait.index]
 
        if (data) {
          let desc: string = trait?.desc ?? ''
  
          Object.keys(data).forEach(d => {
            desc = desc.replaceAll(d, data[d])
          })
  
          return {
            ...trait,
            desc
          }
          
        } else {
          return trait
        }
      } else {
        return trait
      }
    })

    return {
      index: subraza.index,
      name: subraza.name,
      img: subraza.img,
      desc: subraza.desc,
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses ?? []),
      traits: traitsData,
      options: formatearOptions(subraza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      resistances: this.dañoRepository.obtenerDañosPorIndices(subraza?.resistances ?? []),
      types: this.formatearTipos(subraza?.types)
    }
  }

  formatearTipos(tipos: TypeMongo[]): TypeApi[] {
    const formateadas = tipos.map(tipo => this.formatearTipo(tipo))

    formateadas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return formateadas;
  }

  formatearTipo(tipo: TypeMongo): TypeApi {
    return {
      name: tipo.name,
      img: tipo.img,
      desc: tipo.desc,
    }
  }
}
