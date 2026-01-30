import IClaseRepository from '../../../../domain/repositories/IClaseRepository';
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import { ChoiceApi } from '../../../../domain/types';
import { ClaseApi, ClaseLevelUp, ClaseMongo, SpellcastingLevel, SubclaseApi, SubclaseMongo, SubclaseOptionApi, SubclasesMongo, SubclasesOptionsMongo, SubclasesOptionsMongoOption } from '../../../../domain/types/clases.types';
import { DoteApi } from '../../../../domain/types/dotes.types';
import { formatearSalvacion } from '../../../../utils/formatters';
import ClaseSchema from '../schemas/Clase';

export default class ClaseRepository implements IClaseRepository {
  constructor(
    private readonly habilidadRepository: IHabilidadRepository,
    private readonly competenciaRepository: ICompetenciaRepository,
    private readonly equipamientoRepository: IEquipamientoRepository,
    private readonly rasgoRepository: IRasgoRepository,
    private readonly conjuroRepository: IConjuroRepository,
    private readonly doteRepository: IDoteRepository,
    private readonly invocacionRepository: IInvocacionRepository,
    private readonly idiomaRepository: IIdiomaRepository
  ) { }

  async obtenerTodas(): Promise<ClaseApi[]> {
    try {
      const clases = await ClaseSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearClases(clases);
    } catch (error) {
      console.error("Error obteniendo clases:", error);
      throw new Error("No se pudieron obtener los clases");
    }
  }

  async dataLevelUp(idClase: string, level: number, subclasses: string[]): Promise<ClaseLevelUp | null> {
    const clase = await ClaseSchema.findOne({ index: idClase })

    if (!clase) {
      return null
    }

    const dataLevel = clase.levels.find(data => data.level === level)
    const dataLevelOld = clase.levels.find(data => data.level === level - 1)

    if (!dataLevel) {
      return null
    }

    const traitsId = []

    Object.keys(dataLevel?.traits_data ?? {})?.forEach(t => {
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

    let dotes: ChoiceApi<DoteApi> | undefined = undefined

    if (dataLevel.ability_score) {
      dotes = await this.doteRepository.formatearOpcionesDeDote(1)
    }

    const spell_choices = await this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.spell_choices)
    const mixed_spell = await this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.mixed_spell_choices?.options)
    const spell_changes_aux = await this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.spell_changes?.options)

    const mixed_spell_choices = Array.from({ length: dataLevel?.mixed_spell_choices?.number ?? 0 }, () => mixed_spell?.map(opt => ({ ...opt })) ?? []);
    const spell_changes = Array.from({ length: dataLevel?.spell_changes?.number ?? 0 }, () => spell_changes_aux?.map(opt => ({ ...opt })) ?? []);

    const skill_choices = await this.habilidadRepository.formatearOpcionesDeHabilidad(dataLevel.skill_choices)
    const invocations_choices = await this.invocacionRepository.obtenerOpciones(dataLevel.invocations ?? 0)
    const invocations_change = await this.invocacionRepository.obtenerOpciones(dataLevel.invocations_change ?? 0)

    const spells = await this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spell_group?.level ?? 0, dataLevel?.spell_group?.class ?? '')

    let traits_options = undefined

    if (dataLevel?.traits_options) {
      const traitsAux = await this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits_options?.options ?? [])
      traits_options = {
        ...dataLevel.traits_options,
        options: traitsAux
      }
    }

    const uniqueSpells = [
      ...new Map(
        [
          ...spells,
          ...subclaseData
            .filter((item): item is SubclaseApi => !!item?.spells)
            .flatMap(item => item.spells ?? [])
        ].map(spell => [spell.index, spell]) // Usamos el index como clave del Map
      ).values()
    ].sort((a, b) => a.name.localeCompare(b.name));

    return {
      hit_die: clase.hit_die,
      traits: [
        ...traits ?? [],
        ...subclaseData.filter(index => index !== null && index !== undefined).flatMap(item => item.traits) ?? []
      ],
      traits_data: dataLevel.traits_data,
      traits_options:
        traits_options
        ?? subclaseData.filter(index => index !== null && index !== undefined)[0]?.traits_options
        ?? undefined,
      subclasesData,
      ability_score: dataLevel.ability_score,
      dotes,
      double_skills: dataLevel.double_skills,
      spell_choices,
      mixed_spell_choices: [
        ...mixed_spell_choices ?? [],
        ...subclaseData
          .filter((item): item is SubclaseApi => !!item?.mixed_spell_choices)
          .map(item => item.mixed_spell_choices ?? [])
          .flat() ?? []
      ],
      spells: [...uniqueSpells ?? []],
      spell_changes,
      skill_choices,
      invocations_choices,
      invocations_change
    }
  }

  async spellcastingClases(clases: { id: string, level: number }[]): Promise<(SpellcastingLevel | null)[]> {
    const idx = clases.map(clase => clase.id)

    const clasesData = await ClaseSchema.find({ index: idx })

    return Promise.all(clasesData.map(clase => this.spellcastingClase(clase, clases)))
  }

  private async spellcastingClase(clase: ClaseMongo, clasesLevel: { id: string, level: number }[]): Promise<SpellcastingLevel | null> {
    const level = clasesLevel.find(clas => clas.id === clase.index)?.level

    if (!level) return null

    const spellcasting = clase.levels.find(lev => lev.level === level)?.spellcasting

    if (!spellcasting) return null

    return {
      class: clase.index,
      ability: clase.spellcasting,
      spellcasting
    }
  }

  private formatearClases(clases: ClaseMongo[]) {
    return Promise.all(
      clases
        .filter(clase =>
          clase.index === 'barbarian' ||
          clase.index === 'bard' ||
          clase.index === 'warlock' ||
          clase.index === 'cleric' /*|| 
          clase.index === 'ranger' || 
          clase.index === 'wizard' || 
          clase.index === 'monk' || 
          clase.index === 'sorcerer'*/
        )
        .map(clase => this.formatearClase(clase))
    );
  }

  private async formatearClase(clase: ClaseMongo): Promise<ClaseApi> {
    const dataLevel = clase?.levels?.find(level => level.level === 1)

    const [
      traits,
      proficiencies,
      proficiencies_choices,
      skill_choices,
      spells,
      spell_choices,
      equipment,
      equipment_choices
    ] = await Promise.all([
      this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits ?? [], dataLevel?.traits_data),
      this.competenciaRepository.obtenerCompetenciasPorIndices([...clase.proficiencies ?? [], ...dataLevel?.proficiencies ?? []]),
      this.competenciaRepository.formatearOpcionesDeCompetencias(clase?.proficiencies_choices ?? []),
      this.habilidadRepository.formatearOpcionesDeHabilidad(clase.skill_choices),
      this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spell_group?.level ?? 0, dataLevel?.spell_group?.class ?? ''),
      this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.spell_choices),
      this.equipamientoRepository.obtenerEquipamientosPersonajePorIndices(clase?.equipment),
      this.equipamientoRepository.formatearOpcionesDeEquipamientos(clase?.equipment_choices)
    ])

    const subclasesData = await this.formatearSubclaseType(dataLevel?.subclasses_options, dataLevel?.subclasses)

    return {
      index: clase.index,
      name: clase.name,
      description: clase?.description ?? [],
      hit_die: clase.hit_die ?? 0,
      img: clase.img,
      prof_bonus: 2,
      proficiencies,
      proficiencies_choices,
      saving_throws: formatearSalvacion(clase?.saving_throws ?? []),
      skill_choices,
      spells,
      spell_choices,
      equipment,
      equipment_choices,
      traits,
      traits_data: dataLevel?.traits_data ?? {},
      subclasesData: subclasesData ?? undefined,
      /*money: */
      /*spellcasting_options: ,
      spells ,
      /*traits_options: traitsOptions,
      terrain_options: terrainOptions,
      enemy_options: enemyOptions,*/
      //subclases_options: subclasesOptions
    };

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


  }

  private valoresNumericosDistintos(obj1: { [key: string]: string }, obj2: { [key: string]: string } | null): boolean {
    for (const key in obj1) {
      if (!obj2) {
        return true
      } else if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }

  private async formatearSubclaseType(subclase_type: SubclasesOptionsMongo | undefined, subclases: SubclasesMongo | undefined) {
    if (subclase_type && subclases) {
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

  private async formatearSubclases(subclases_options: SubclasesOptionsMongoOption[], subclases: SubclasesMongo) {
    const formateadas = await Promise.all(subclases_options.map(subclase_option => this.formatearSubclaseOption(subclase_option, subclases)))

    formateadas.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }

  private async formatearSubclaseOption(subclase_option: SubclasesOptionsMongoOption, subclases: SubclasesMongo): Promise<SubclaseOptionApi> {
    const subclaseData = subclases[subclase_option?.index]
    const subclase = await this.formatearSubclase(subclaseData)

    return {
      index: subclase_option?.index,
      name: subclase_option?.name,
      img: subclase_option?.img,
      traits: subclase.traits,
      traits_options: subclase?.traits_options,
      skill_choices: subclase?.skill_choices,
      double_skill_choices: subclase?.double_skill_choices,
      proficiencies: subclase?.proficiencies,
      spells: subclase?.spells,
      spell_choices: subclase?.spell_choices,
      language_choices: subclase?.language_choices,
      /*traits_data_options: subclaseData.traits_data_options,/*
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),*//* 
      options: ,
      proficiencies: ,
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

  private async formatearSubclase(subclase: SubclaseMongo): Promise<SubclaseApi> {
    const traitsId = subclase?.traits ?? []

    Object.keys(subclase?.traits_data ?? {})?.forEach(t => {
      traitsId.push(t)
    })

    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(traitsId, subclase?.traits_data ?? {})

    let traits_options = undefined

    if (subclase?.traits_options) {
      const traitsAux = await this.rasgoRepository.obtenerRasgosPorIndices(subclase?.traits_options?.options ?? [])
      traits_options = {
        ...subclase.traits_options,
        options: traitsAux
      }
    }

    const mixed_spell = await this.conjuroRepository.formatearOpcionesDeConjuros(subclase?.mixed_spell_choices?.options)
    const mixed_spell_choices = Array.from({ length: subclase?.mixed_spell_choices?.number ?? 0 }, () => mixed_spell?.map(opt => ({ ...opt })) ?? []);

    const skill_choices = await this.habilidadRepository.formatearOpcionesDeHabilidad(subclase.skill_choices)
    const proficiencies = await this.competenciaRepository.obtenerCompetenciasPorIndices(subclase?.proficiencies ?? [])
    const spells = await this.conjuroRepository.obtenerConjurosPorIndices(subclase?.spells ?? [])
    const languagesOptions = await this.idiomaRepository.formatearOpcionesDeIdioma(subclase?.language_choices)
    const double_skill_choices = await this.habilidadRepository.formatearOpcionesDeHabilidad(subclase?.double_skill_choices)
    const spell_choices = await this.conjuroRepository.formatearOpcionesDeConjuros(subclase?.spell_choices)

    return {
      traits,
      traits_options: traits_options,
      mixed_spell_choices,
      skill_choices,
      double_skill_choices,
      proficiencies,
      spells,
      spell_choices,
      language_choices: languagesOptions
      /*traits_data_options: subclaseData.traits_data_options,/*
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),*//*
      options: ,
      proficiencies: ,
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


  /*
    async getClase(index: string) {
      const clase = await ClaseSchema.find({index});
  
      return clase[0] ?? null
    }*/
  /*
  
   async formatearClase(clase: ClaseMongo): Promise<ClaseApi> {  
     const dataLevel = clase?.levels?.find((level: any) => level.level === 1)
 
     const traits = await this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits ?? [], dataLevel?.traits_data)
     
     
 
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
 
     const subclasesOptions = await this.formatearSubclasesType(dataLevel?.subclasses_options ?? [], dataLevel?.subclasses)*//*

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
equipment: 
equipment_options: 
traits,
traits_data: dataLevel?.traits_data ?? {}
/*money: */
  /*spellcasting_options: 
  spells ,
  /*traits_options: traitsOptions,
  terrain_options: terrainOptions,
  enemy_options: enemyOptions,*//*
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
      })*//*

return {
index: subclase_option?.index,
name: subclase_option?.name,
img: subclase_option?.img,
traits: subclase.traits,
traits_options: subclase?.traits_options,
/*traits_data_options: subclaseData.traits_data_options,/*
languages: this.idiomaRepository.obtenerIdiomasPorIndices(subclaseData?.languages ?? []),*//*
                                                                                                                                                    options: ,
                                                                                                                                                    proficiencies: ,
                                                                                                                                                    spells: this.conjuroRepository.obtenerConjurosPorIndices(subclaseData?.spells ?? []),
                                                                                                                                                    disciplines: this.disciplinaRespository.obtenerDisciplinasPorIndices(subclaseData?.disciplines ?? []),
                                                                                                                                                    disciplines_new: {
                                                                                                                                                      choose: subclaseData?.disciplines_new ?? 0,
                                                                                                                                                      options: subclaseData?.disciplines_new
                                                                                                                                                        ? this.disciplinaRespository.obtenerTodos()
                                                                                                                                                        : []
                                                                                                                                                    }*//*
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
                                                                                                                                            options: ,
                                                                                                                                            proficiencies: ,
                                                                                                                                            spells: this.conjuroRepository.obtenerConjurosPorIndices(subclaseData?.spells ?? []),
                                                                                                                                            disciplines: this.disciplinaRespository.obtenerDisciplinasPorIndices(subclaseData?.disciplines ?? []),
                                                                                                                                            disciplines_new: {
                                                                                                                                            choose: subclaseData?.disciplines_new ?? 0,
                                                                                                                                            options: subclaseData?.disciplines_new
                                                                                                                                              ? this.disciplinaRespository.obtenerTodos()
                                                                                                                                              : []
                                                                                                                                            }*//*
}
}*/
}
