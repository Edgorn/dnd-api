import IClaseRepository from '../../../../domain/repositories/IClaseRepository';
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDisciplinaRepository from '../../../../domain/repositories/IDisciplinaRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import { formatearEquipamientosOptions, formatearCompetencias, formatearOptions, formatearSalvacion, formatearEquipamiento, formatearDinero } from '../../../../utils/formatters';
const ClaseSchema = require('../schemas/Clase');
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import DisciplinaRepository from './disciplina.repository';
import EquipamientoRepository from './equipamiento.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';

export default class ClaseRepository extends IClaseRepository {
  rasgoRepository: IRasgoRepository
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  equipamientoRepository: IEquipamientoRepository
  idiomaRepository: IIdiomaRepository
  conjuroRepository: IConjuroRepository
  disciplinaRespository: IDisciplinaRepository

  constructor() {
    super()
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.equipamientoRepository = new EquipamientoRepository()
    this.rasgoRepository = new RasgoRepository(this.conjuroRepository)
    this.disciplinaRespository = new DisciplinaRepository(this.conjuroRepository)
  }

  async obtenerTodas() {
    const clases = await ClaseSchema.find();
    
    await this.idiomaRepository.init()
    await this.rasgoRepository.init()

    return this.formatearClases(clases)
  }

  async getClase(index: string) {
    const clase = await ClaseSchema.find({index});

    return clase[0] ?? null
  }
 
  formatearClases(clases: any) {
    const formateadas = clases
      .filter((clase: any) => clase.index === 'barbarian' || clase.index === 'warlock' || clase.index === 'cleric' || clase.index === 'wizard' || clase.index === 'monk' || clase.index === 'sorcerer') 
      .map((clase: any) => this.formatearClase(clase))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  } 
 
  formatearClase(clase: any) {  
    const dataLevel = clase?.levels?.find((level: any) => level.level === 1)
    /*
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

    const traits = this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits ?? [])

    const traitsData = traits?.map(trait => {
      if (dataLevel?.traits_data) {
        const data = dataLevel?.traits_data[trait.index]
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

    const spells = dataLevel?.spellcasting?.all_spells
      ? this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spellcasting?.all_spells, clase.index) 
      : []
 
    return {
      index: clase.index,
      name: clase.name,
      desc: clase?.desc ?? '',
      hit_die: clase.hit_die ?? 0,
      img: clase.img,
      proficiencies: formatearCompetencias(clase?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      saving_throws: formatearSalvacion(clase?.saving_throws ?? []),
      options: formatearOptions(clase?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      equipment: formatearEquipamiento(clase?.starting_equipment ?? [], this.equipamientoRepository),
      equipment_options: formatearEquipamientosOptions(clase?.starting_equipment_options ?? [], this.equipamientoRepository),
      traits: traitsData,
      /*money: formatearDinero(clase.money, this.equipamientoRepository),*/
      spellcasting_options: formatearOptions(dataLevel?.spellcasting?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells ,
      /*traits_options: traitsOptions,
      terrain_options: terrainOptions,
      enemy_options: enemyOptions,*/
      subclases_options: this.formatearSubclasesType(dataLevel?.subclasses_options ?? [], dataLevel?.subclasses)
    };
  }

  async formatearSubclasesType(subclasses_type: any[], subclases: any) {
    const formateadas = await Promise.all(subclasses_type.map(subclasse_type => this.formatearSubclaseType(subclasse_type, subclases)))

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

  async formatearSubclaseType(subclase_type: any, subclases: any) {
    const options = await this.formatearSubclases(subclase_type?.options, subclases)
    return {
      name: subclase_type.name,
      desc: subclase_type.desc,
      options
    }
  }

  async formatearSubclases(subclases_options: any[], subclases: any) {
    const formateadas = await Promise.all(subclases_options.map(subclase_option => this.formatearSubclase(subclase_option, subclases)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }

  async formatearSubclase(subclase_option: any, subclases: any) {
    const subclaseData = subclases[subclase_option?.index]

    const traits_options_subclase = subclaseData?.traits_options

    await this.rasgoRepository.init()
    await this.conjuroRepository.init()
    await this.disciplinaRespository.init()

    if (traits_options_subclase) {
      traits_options_subclase.options = this.rasgoRepository.obtenerRasgosPorIndices(subclaseData?.traits_options?.options ?? [])
    }
  
    const traits = this.rasgoRepository.obtenerRasgosPorIndices(subclaseData?.traits ?? [])

    const traitsData = traits?.map((trait: any) => {
      if (subclaseData?.traits_data) {
        const data = subclaseData?.traits_data[trait.index]
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
      index: subclase_option?.index,
      name: subclase_option?.name,
      img: subclase_option?.img,
      traits: traitsData,
      traits_options: traits_options_subclase,
      traits_data_options: subclaseData.traits_data_options,/*
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),*/
      options: formatearOptions(subclaseData?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      proficiencies: formatearCompetencias(subclaseData?.proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      spells: this.conjuroRepository.obtenerConjurosPorIndices(subclaseData?.spells ?? []),
      disciplines: this.disciplinaRespository.obtenerDisciplinasPorIndices(subclaseData?.disciplines ?? []),
      disciplines_new: {
        choose: subclaseData?.disciplines_new ?? 0,
        options: subclaseData?.disciplines_new
          ? this.disciplinaRespository.obtenerTodos()
          : []
      }
    }
  }
}
