import IClaseRepository from '../../../../domain/repositories/IClaseRepository';
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IDisciplinaRepository from '../../../../domain/repositories/IDisciplinaRepository';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import { ClaseApi, ClaseLevelUp, ClaseMongo, SubclaseApi, SubclaseMongo, SubclaseOptionApi, SubclasesMongo, SubclasesOptionsMongo, SubclasesOptionsMongoOption } from '../../../../domain/types/clases';
import { formatearEquipamientosOptions, formatearCompetencias, formatearOptions, formatearSalvacion, formatearEquipamiento, formatearDinero } from '../../../../utils/formatters';
import ClaseSchema from '../schemas/Clase';
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import DañoRepository from './daño.repository';
import DisciplinaRepository from './disciplina.repository';
import DoteRepository from './dote.repository';
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
  dañoRepository: IDañoRepository
  doteRepository: IDoteRepository

  constructor() {
    super()
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.equipamientoRepository = new EquipamientoRepository()
    this.dañoRepository = new DañoRepository()
    this.rasgoRepository = new RasgoRepository(/*this.conjuroRepository,*/ this.dañoRepository)
    this.disciplinaRespository = new DisciplinaRepository(this.conjuroRepository)
    this.doteRepository = new DoteRepository()
  }

  async obtenerTodas() {
    const clases = await ClaseSchema.find();
    
    await this.idiomaRepository.init()

    const clasesFormateadas = await this.formatearClases(clases)

    return clasesFormateadas
  }
/*
  async getClase(index: string) {
    const clase = await ClaseSchema.find({index});

    return clase[0] ?? null
  }*/
 
  async formatearClases(clases: ClaseMongo[]) {
    const formateadas = await Promise.all(clases
      .filter(clase => 
        clase.index === 'barbarian' /*|| 
        clase.index === 'warlock' || 
        clase.index === 'cleric' || 
        clase.index === 'wizard' || 
        clase.index === 'monk' || 
        clase.index === 'sorcerer'*/
      ) 
      .map((clase: any) => this.formatearClase(clase)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  } 
 
  async formatearClase(clase: ClaseMongo): Promise<ClaseApi> {  
    const dataLevel = clase?.levels?.find((level: any) => level.level === 1)

    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits ?? [], dataLevel?.traits_data)
    const competencias = await formatearCompetencias(clase?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository)
    const options = await formatearOptions(clase?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository)

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

    const subclasesOptions = await this.formatearSubclasesType(dataLevel?.subclasses_options ?? [], dataLevel?.subclasses)*/

    return {
      index: clase.index,
      name: clase.name,
      desc: clase?.desc ?? '',
      hit_die: clase.hit_die ?? 0,
      img: clase.img,
      prof_bonus: dataLevel?.prof_bonus ?? 0,
      proficiencies: competencias,
      saving_throws: formatearSalvacion(clase?.saving_throws ?? []),
      options,
      equipment: formatearEquipamiento(clase?.starting_equipment ?? [], this.equipamientoRepository),
      equipment_options: formatearEquipamientosOptions(clase?.starting_equipment_options ?? [], this.equipamientoRepository),
      traits,
      traits_data: dataLevel?.traits_data ?? {}
      /*money: formatearDinero(clase.money, this.equipamientoRepository),*/
      /*spellcasting_options: formatearOptions(dataLevel?.spellcasting?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells ,
      /*traits_options: traitsOptions,
      terrain_options: terrainOptions,
      enemy_options: enemyOptions,*/
      //subclases_options: subclasesOptions
    };
  }

  async dataLevelUp(idClase: string, level: number, subclasses: string[]): Promise<ClaseLevelUp | null> {
    const clase = await ClaseSchema.findOne({ index: idClase })

    if (clase) {
      const dataLevel = clase.levels.find(data => data.level === level)
      const dataLevelOld = clase.levels.find(data => data.level === level-1)

      if (dataLevel) {
        const traitsId = []

        Object.keys(dataLevel?.traits_data).forEach(t => {
          const data = dataLevel.traits_data[t]
          const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null
    
          if (this.valoresNumericosDistintos(data, dataOld)) {
            traitsId.push(t)
          }
        }) 

        traitsId.push(...dataLevel?.traits ?? [])

        const traitsSinRepetidos = [...new Set(traitsId)];
        const traits = await this.rasgoRepository.obtenerRasgosPorIndices(traitsSinRepetidos, dataLevel?.traits_data)

        const subclasesData = await this.formatearSubclaseType(dataLevel.subclasses_options, dataLevel.subclasses)

        const subclaseData = await Promise.all(
          subclasses.map(subclase => {
            if (dataLevel?.subclasses && dataLevel?.subclasses[subclase]) {
              return this.formatearSubclase(dataLevel.subclasses[subclase])
            } else {
              return null
            }
          })
        )

        return {
          hit_die: clase.hit_die,
          prof_bonus: dataLevel.prof_bonus,
          traits: [
            ...traits ?? [],
            ...subclaseData.filter(index => index !== null && index !== undefined).flatMap(item => item.traits) ?? []
          ],
          traits_data: dataLevel.traits_data,
          traits_options: subclaseData.filter(index => index !== null && index !== undefined)[0]?.traits_options ?? undefined,
          subclasesData,
          ability_score: dataLevel.ability_score
        }
      } else {
        return null
      }
    } else {
      return null
    }
  }

  async formatearSubclaseType(subclase_type: SubclasesOptionsMongo, subclases: SubclasesMongo) {
    if (subclase_type) {
      const options = await this.formatearSubclases(subclase_type?.options, subclases)
      
      return {
        name: subclase_type.name,
        desc: subclase_type.desc,
        options: options.filter(option => option.index !== "fanatic")
      }
    } else {
      return null
    }
    
  }

  async formatearSubclases(subclases_options: SubclasesOptionsMongoOption[], subclases: SubclasesMongo) {
    const formateadas = await Promise.all(subclases_options.map(subclase_option => this.formatearSubclaseOption(subclase_option, subclases)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }

  async formatearSubclaseOption(subclase_option: SubclasesOptionsMongoOption, subclases: SubclasesMongo): Promise<SubclaseOptionApi>  {
    const subclaseData = subclases[subclase_option?.index]

    const subclase = await this.formatearSubclase(subclaseData)
/*
    const traits_options_subclase = subclaseData?.traits_options

    await this.disciplinaRespository.init()

    if (traits_options_subclase) {
      traits_options_subclase.options = this.rasgoRepository.obtenerRasgosPorIndices(subclaseData?.traits_options?.options ?? [])
    }
  */
/*
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
    })*/

    return {
      index: subclase_option?.index,
      name: subclase_option?.name,
      img: subclase_option?.img,
      traits: subclase.traits,
      traits_options: subclase?.traits_options,
      /*traits_data_options: subclaseData.traits_data_options,/*
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),*//*
      options: formatearOptions(subclaseData?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      proficiencies: formatearCompetencias(subclaseData?.proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      spells: this.conjuroRepository.obtenerConjurosPorIndices(subclaseData?.spells ?? []),
      disciplines: this.disciplinaRespository.obtenerDisciplinasPorIndices(subclaseData?.disciplines ?? []),
      disciplines_new: {
        choose: subclaseData?.disciplines_new ?? 0,
        options: subclaseData?.disciplines_new
          ? this.disciplinaRespository.obtenerTodos()
          : []
      }*/
    }
  }

  async formatearSubclase(subclase: SubclaseMongo): Promise<SubclaseApi> {
    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(subclase?.traits ?? [])
    
    let traits_options = undefined

    if (subclase?.traits_options) {
      const traitsAux = await this.rasgoRepository.obtenerRasgosPorIndices(subclase?.traits_options?.options ?? [])
      traits_options = {
        ...subclase.traits_options,
        options: traitsAux
      }
    }

    return {
      traits,
      traits_options: traits_options,
      /*traits_data_options: subclaseData.traits_data_options,/*
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),*//*
      options: formatearOptions(subclaseData?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      proficiencies: formatearCompetencias(subclaseData?.proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      spells: this.conjuroRepository.obtenerConjurosPorIndices(subclaseData?.spells ?? []),
      disciplines: this.disciplinaRespository.obtenerDisciplinasPorIndices(subclaseData?.disciplines ?? []),
      disciplines_new: {
        choose: subclaseData?.disciplines_new ?? 0,
        options: subclaseData?.disciplines_new
          ? this.disciplinaRespository.obtenerTodos()
          : []
      }*/
    }
  }
  
  valoresNumericosDistintos(obj1: any, obj2: any): boolean {
    for (const key in obj1) {
      if (!obj2) {
        return true
      } else if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }
}
