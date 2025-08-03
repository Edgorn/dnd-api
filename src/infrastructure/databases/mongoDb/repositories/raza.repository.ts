import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IRazaRepository from '../../../../domain/repositories/IRazaRepository';
import { RaceApi, RaceMongo, SubraceApi, SubraceMongo, TypeApi, TypeMongo, VarianteApi, VarianteMongo } from '../../../../domain/types/razas.types';
import { formatearAbilityBonusChoices, formatearAbilityBonuses, ordenarPorNombre } from '../../../../utils/formatters';
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import DañoRepository from './daño.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';
import RazaSchema from '../schemas/Raza';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import DoteRepository from './dote.repository';

export default class RazaRepository implements IRazaRepository {
  idiomaRepository: IIdiomaRepository
  rasgoRepository: IRasgoRepository
  dañoRepository: IDañoRepository
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository
  doteRepository: IDoteRepository

  constructor() {
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.dañoRepository = new DañoRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.rasgoRepository = new RasgoRepository(this.dañoRepository, this.competenciaRepository)
    this.habilidadRepository = new HabilidadRepository()
    this.doteRepository = new DoteRepository()
  }

  async obtenerTodas(): Promise<RaceApi[]> {
    try {
      const razas = await RazaSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearRazas(razas);
    } catch (error) {
      console.error("Error obteniendo razas:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  formatearRazas(razas: RaceMongo[]): Promise<RaceApi[]> {
    return Promise.all(razas.map(raza => this.formatearRaza(raza)));
  } 

  async formatearRaza(raza: RaceMongo): Promise<RaceApi> {
    const [
      traits,
      skill_choices,
      languages,
      language_choices,
      proficiencies_choices,
      subraces,
      variants
    ] = await Promise.all([
      this.rasgoRepository.obtenerRasgosPorIndices(raza?.traits ?? []),
      this.habilidadRepository.formatearOpcionesDeHabilidad(raza.skill_choices),
      this.idiomaRepository.obtenerIdiomasPorIndices(raza?.languages ?? []),
      this.idiomaRepository.formatearOpcionesDeIdioma(raza.language_choices),
      this.competenciaRepository.formatearOpcionesDeCompetencias(raza?.proficiencies_choices),
      this.formatearSubrazas(raza?.subraces ?? []),
      this.formatearVariantes(raza?.variants ?? [])
    ])

    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      img: raza.img,
      speed: raza.speed,
      size: raza.size,
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses ?? []),
      ability_bonus_choices: formatearAbilityBonusChoices(raza?.ability_bonus_choices),
      skill_choices,
      traits,
      languages,
      language_choices,
      proficiencies_choices,
      subraces,
      variants
    }; 
  } 

  async formatearSubrazas(subrazas: SubraceMongo[]): Promise<SubraceApi[]> {
    const formateadas = await Promise.all(subrazas.map(subraza => this.formatearSubraza(subraza)))
    return ordenarPorNombre(formateadas);
  }

  async formatearSubraza(subraza: SubraceMongo): Promise<SubraceApi> {
    const [
      traits,
      language_choices,
      spell_choices
    ] = await Promise.all([
      this.rasgoRepository.obtenerRasgosPorIndices(subraza?.traits ?? [], subraza?.traits_data),
      this.idiomaRepository.formatearOpcionesDeIdioma(subraza.language_choices),
      this.conjuroRepository.formatearOpcionesDeConjuros(subraza?.spell_choices)
    ])

    return {
      index: subraza.index,
      name: subraza.name,
      img: subraza.img,
      desc: subraza.desc,
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses ?? []),
      traits,
      traits_data: subraza?.traits_data,
      language_choices,
      spell_choices,
      types: this.formatearTipos(subraza?.types)
    }
  }  

  formatearTipos(tipos: TypeMongo[]): TypeApi[] {
    const formateadas = tipos.map(tipo => this.formatearTipo(tipo));
    return ordenarPorNombre(formateadas);
  }

  formatearTipo(tipo: TypeMongo): TypeApi {
    return {
      name: tipo.name,
      img: tipo.img,
      desc: tipo.desc,
    }
  } 

  async formatearVariantes(variantes: VarianteMongo[]): Promise<VarianteApi[]>  {
    const formateadas = await Promise.all(variantes.map(variante => this.formatearVariante(variante)))
    return ordenarPorNombre(formateadas);
  } 

  async formatearVariante(variante: VarianteMongo): Promise<VarianteApi>  {
    const [
      skill_choices,
      dotes
    ] = await Promise.all([
      this.habilidadRepository.formatearOpcionesDeHabilidad(variante.skill_choices),
      this.doteRepository.formatearOpcionesDeDote(variante.dotes)
    ])

    return {
      name: variante.name,
      ability_bonuses: formatearAbilityBonuses(variante?.ability_bonuses ?? []),
      ability_bonus_choices: formatearAbilityBonusChoices(variante?.ability_bonus_choices),
      skill_choices,
      dotes
    }
  }
}
