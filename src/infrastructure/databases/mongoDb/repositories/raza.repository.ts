import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IRazaRepository from '../../../../domain/repositories/IRazaRepository';
import { RaceApi, RaceMongo, SubraceApi, SubraceMongo, TypeApi, TypeMongo, VarianteMongo } from '../../../../domain/types/razas';
import { formatearAbilityBonuses, formatearOptions } from '../../../../utils/formatters';
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import DañoRepository from './daño.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';
import RazaSchema from '../schemas/Raza';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import DoteRepository from './dote.repository';

export default class RazaRepository extends IRazaRepository {
  idiomaRepository: IIdiomaRepository
  rasgoRepository: IRasgoRepository
  dañoRepository: IDañoRepository
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository
  doteRepository: IDoteRepository

  constructor() {
    super()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.dañoRepository = new DañoRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.rasgoRepository = new RasgoRepository(this.dañoRepository, this.competenciaRepository)
    this.habilidadRepository = new HabilidadRepository()
    this.doteRepository = new DoteRepository()
  }

  async obtenerTodas() {
    const razas = await RazaSchema.find();

    const razasFormateadas = await this.formatearRazas(razas)

    return razasFormateadas
  } 

  async formatearRazas(razas: RaceMongo[]) {
    const formateadas = await Promise.all(razas.map(raza => this.formatearRaza(raza)))

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

  async formatearRaza(raza: RaceMongo) {
    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(raza?.traits ?? [])
    const options = await formatearOptions(raza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository)
    const languages = await this.idiomaRepository.obtenerIdiomasPorIndices(raza?.languages ?? [])
    const language_choices = await this.idiomaRepository.formatearOpcionesDeIdioma(raza.language_choices)
    const skill_choices = await this.habilidadRepository.formatearOpcionesDeHabilidad(raza.skill_choices)

    const subraces = await this.formatearSubrazas(raza?.subraces ?? [])
    const variants = await this.formatearVariantes(raza?.variants ?? [])
  
    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      img: raza.img,
      speed: raza.speed,
      size: raza.size,
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses ?? []),
      traits,
      languages,
      language_choices,
      skill_choices,
      options,
      subraces,
      variants
    };
  } 

  async formatearSubrazas(subrazas: SubraceMongo[]) {
    const formateadas = await Promise.all(subrazas.map(raza => this.formatearSubraza(raza)))

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
 
  async formatearSubraza(subraza: SubraceMongo) {
    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(subraza?.traits ?? [], subraza?.traits_data)
    const options = await formatearOptions(subraza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository)
    const language_choices = await this.idiomaRepository.formatearOpcionesDeIdioma(subraza.language_choices)
  
    return {
      index: subraza.index,
      name: subraza.name,
      img: subraza.img,
      desc: subraza.desc,
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses ?? []),
      traits,
      traits_data: subraza?.traits_data,
      language_choices,
      options,
      /*resistances: this.dañoRepository.obtenerDañosPorIndices(subraza?.resistances ?? []),*/
      types: this.formatearTipos(subraza?.types)
    }
  }  

  formatearTipos(tipos: TypeMongo[]) {
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

  formatearTipo(tipo: TypeMongo) {
    return {
      name: tipo.name,
      img: tipo.img,
      desc: tipo.desc,
    }
  } 

  async formatearVariantes(variantes: VarianteMongo[]) {
    const formateadas = await Promise.all(variantes.map(variante => this.formatearVariante(variante)))

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

  async formatearVariante(variante: VarianteMongo) {
    const options = await formatearOptions(variante?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository)
    const skill_choices = await this.habilidadRepository.formatearOpcionesDeHabilidad(variante.skill_choices)

    let dotes = null

    if (variante.dotes) {
      const data = await this.doteRepository.obtenerTodos() 

      dotes = {
        choose: variante.dotes,
        options: data
      } 
    }

    return {
      name: variante.name,
      ability_bonuses: formatearAbilityBonuses(variante?.ability_bonuses ?? []),
      skill_choices,
      options,
      dotes
    }
  }
}
