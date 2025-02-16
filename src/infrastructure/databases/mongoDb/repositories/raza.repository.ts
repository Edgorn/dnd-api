import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IRazaRepository from '../../../../domain/repositories/IRazaRepository';
import { RazaApi, RazaMongo, SubrazaApi, SubrazaMongo } from '../../../../domain/types';
import { formatearAbilityBonuses, formatearConjuros, formatearCompetencias, formatearOptions } from '../../../../utils/formatters';
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

  async obtenerTodas() {
    const razas = await RazaSchema.find();

    return this.formatearRazas(razas)
  }

  async getRaza(index: string) {
    const raza = await RazaSchema.find({index});

    return raza[0] ?? null
  }

  formatearRazas(razas: RazaMongo[]): RazaApi[] {
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

  formatearRaza(raza: RazaMongo): RazaApi {
    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      img: raza.img,
      speed: raza.speed,
      size: raza.size,
      subraces: this.formatearSubrazas(raza?.subraces ?? []),
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses ?? []),
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(raza?.languages ?? []),
      proficiencies: formatearCompetencias(raza?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      traits: this.rasgoRepository.obtenerRasgosPorIndices(raza?.traits ?? []),
      options: formatearOptions(raza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      resistances: this.dañoRepository.obtenerDañosPorIndices(raza?.resistances ?? [])
    };
  }

  formatearSubrazas(subrazas: SubrazaMongo[]): SubrazaApi[] {
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

  formatearSubraza(subraza: SubrazaMongo): SubrazaApi {
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
      speed: subraza.speed,
      types: subraza?.types,
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses ?? []),
      proficiencies: formatearCompetencias(subraza?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      traits: traitsData,
      options: formatearOptions(subraza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      resistances: this.dañoRepository.obtenerDañosPorIndices(subraza?.resistances ?? []),
      spells: formatearConjuros(subraza.spells, this.conjuroRepository, this.rasgoRepository)
    }
  }
}
