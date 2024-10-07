import IClaseRepository from '../../../../domain/repositories/IClaseRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
const { formatearCompetencias, formatearOptions, formatearSalvacion, formatearEquipamiento, formatearEquipamientosOptions, formatearDinero } = require('../../../../utils/formatters-old');
const ClaseSchema = require('../schemas/Clase');
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
const EquipamientoRepository = require('./equipamiento.repository');
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';

export default class ClaseRepository extends IClaseRepository {
  rasgoRepository: IRasgoRepository

  constructor() {
    super()
    /*this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.equipamientoRepository = new EquipamientoRepository()*/
    this.rasgoRepository = new RasgoRepository()
  }

  async obtenerTodas() {
    const clases = await ClaseSchema.find();

    return this.formatearClases(clases)
  }

  formatearClases(clases: any) {
    const formateadas = clases
      .filter((clase: any) => clase.index === 'barbarian')
      .map((clase: any) => this.formatearClase(clase))

    formateadas.sort((a: any, b: any) => {
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

  formatearClase(clase: any) {
    
    const dataLevel = clase?.levels?.find((level: any) => level.level === 1)/*
    const dataSpells = dataLevel?.spellcasting?.spells?.split('_')
    const traitsOptions = dataLevel?.traits_options
    const terrainOptions = dataLevel?.terrain_options
    const enemyOptions = []

    if (traitsOptions) {
      traitsOptions.options = this.rasgoRepository
        .obtenerRasgosPorIndices(traitsOptions?.options ?? [])
        .map(trait => {  return { index: trait.index, name: trait.name } })
    }
    
    if (terrainOptions) {
      terrainOptions.options = terrainOptions?.options.map(opt => {
        return {
          index: opt,
          name: opt
        }
      })
    }

    if (dataLevel?.enemy_options) {
      enemyOptions.push(
        ...dataLevel?.enemy_options.map(en => {
          return {
            ...en,
            options: en.options.map(opt => {
              return {
                index: opt,
                name: opt
              }
            })
          }
        })
      )
    }
    */
    return {
      index: clase.index,
      name: clase.name,
      desc: clase?.desc ?? '',
      //hit_die: clase.hit_die ?? 0,
      img: clase.img,
      /*proficiencies: formatearCompetencias(clase?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      saving_throws: formatearSalvacion(clase?.saving_throws ?? []),
      options: formatearOptions(clase?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      equipment: formatearEquipamiento(clase?.starting_equipment ?? [], this.equipamientoRepository),
      equipment_options: formatearEquipamientosOptions(clase?.starting_equipment_options ?? [], this.equipamientoRepository),*/
      traits: this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits ?? []),/*
      money: formatearDinero(clase.money, this.equipamientoRepository),
      spellcasting_options: formatearOptions(dataLevel?.spellcasting?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells: dataSpells ? this.conjuroRepository.obtenerConjurosPorNivelClase(dataSpells[0], dataSpells[1]) : [],
      traits_options: traitsOptions,
      terrain_options: terrainOptions,
      enemy_options: enemyOptions,
      subclases_options: this.formatearSubclasesType(dataLevel?.subclasses_options ?? [], dataLevel?.subclasses)*/
    };
  }
/*
  formatearSubclasesType(subclasses_type, subclases) {
    const formateadas = subclasses_type.map(subclasse_type => this.formatearSubclaseType(subclasse_type, subclases))

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

  formatearSubclaseType(subclase_type, subclases) {
    return {
      name: subclase_type.name,
      desc: subclase_type.desc,
      options: this.formatearSubclases(subclase_type?.options, subclases)
    }
  }

  formatearSubclases(subclases_options, subclases) {
    const formateadas = subclases_options.map(subclase_option => this.formatearSubclase(subclase_option, subclases))

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

  formatearSubclase(subclase_option, subclases) {
    const subclaseData = subclases[subclase_option?.index]

    const traits_options_subclase = subclaseData?.traits_options

    if (traits_options_subclase) {
      traits_options_subclase.options = this.rasgoRepository.obtenerRasgosPorIndices(subclaseData?.traits_options?.options ?? [])
    }

    return {
      index: subclase_option?.index,
      name: subclase_option?.name,
      traits: this.rasgoRepository.obtenerRasgosPorIndices(subclaseData?.traits ?? []),
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),
      options: formatearOptions(subclaseData?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      proficiencies: formatearCompetencias(subclaseData?.proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      spells: this.conjuroRepository.obtenerConjurosPorIndices(subclaseData?.spells ?? []),
      traits_options: traits_options_subclase
    }
  }*/

}
