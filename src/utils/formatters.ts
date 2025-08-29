import ICompetenciaRepository from "../domain/repositories/ICompetenciaRepository"
import IConjuroRepository from "../domain/repositories/IConjuroRepository"
import IDoteRepository from "../domain/repositories/IDoteRepository"
import IEquipamientoRepository from "../domain/repositories/IEquipamientoRepository"
import IHabilidadRepository from "../domain/repositories/IHabilidadRepository"
import IIdiomaRepository from "../domain/repositories/IIdiomaRepository"
import IRasgoRepository from "../domain/repositories/IRasgoRepository"
import { AbilityBonusesApi, AbilityBonusesMongo, ChoiceApi, ChoiceMongo, EquipamientoOpcionesApi, EquipamientoOpcionesMongo, OptionsApi, OptionSelectApi, OptionsMongo } from "../domain/types"
import { EquipamientoPersonajeApi, EquipamientoPersonajeMongo } from "../domain/types/equipamientos.types"
import { HabilidadApi } from "../domain/types/habilidades.types"

const caracteristicas: {[key: string]: string} = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

export const mapStringArrayToLabelValue = (arr?: string[]): OptionSelectApi[] => {
  return arr?.map(opt => ({ label: opt, value: opt })) ?? [];
}

export const ordenarPorNombre = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => 
    a?.name?.localeCompare(b?.name, 'es', { sensitivity: 'base' })
  );
}

export const formatearAbilityBonusChoices = (ability_bonus_choices: ChoiceMongo): ChoiceApi<AbilityBonusesApi> | undefined => {
  if (!ability_bonus_choices) return undefined;

  if (Array.isArray(ability_bonus_choices.options)) {
    const options = ability_bonus_choices.options.map(option => {
      return {
        index: option,
        name: caracteristicas[option] ?? option,
        bonus: 1
      }
    })
    
    return {
      ...ability_bonus_choices,
      options
    };
  }

  return undefined
}

export const formatearAbilityBonuses = (ability_bonuses: AbilityBonusesMongo[]): AbilityBonusesApi[] => {
  const abilityBonuses = ability_bonuses?.map(ability => {
    return {
      index: ability?.index,
      name: caracteristicas[ability?.index] ?? ability.index,
      bonus: ability?.bonus
    }
  })

  return abilityBonuses
}

export const formatearConjuros = async (spellsApi: string[], conjuroRepository: IConjuroRepository, rasgoRepository: IRasgoRepository) => {
  const conjuros = spellsApi.map(async spell => {
    const arraySpell = spell.split('_')
    //const conjuro = conjuroRepository.obtenerConjuroPorIndice(arraySpell[0])

    //if (!conjuro) {
      return null;
    //}
/*
    const caracteristica = caracteristicas[arraySpell[1]] 

    let tipo = ''

    if (caracteristica) {
      tipo = caracteristica
    } else {
      /*const rasgo = await rasgoRepository.obtenerRasgoPorIndice(arraySpell[1] ?? null)
      tipo = rasgo?.name ?? ''*//*
      tipo = "MIRAR FORMATEAR CONJUROS"
    }

    return {
      ...conjuro,
      type: arraySpell[1],
      typeName: tipo
    }*/
  })
  .filter(conjuro => conjuro !== null);

  return conjuros
}

export async function formatearCompetencias (proficiencies: any[], habilidadRepository: IHabilidadRepository, competenciaRepository: ICompetenciaRepository): Promise<any[]> {
  const indicesHabilidades = 
    proficiencies
      .filter(proficiency => proficiency.type === 'habilidad')
      .map(proficiency => proficiency.index)

  if (indicesHabilidades.length > 0) console.log("formatearHabilidades", indicesHabilidades)

  const habilidades = await habilidadRepository.obtenerHabilidadesPorIndices(indicesHabilidades)
      
  const indicesCompetencias =
    proficiencies
      .filter(proficiency => proficiency.type !== 'habilidad')
      .map(proficiency => proficiency.index)
  
  if (indicesCompetencias.length > 0) console.log("formatearCompetencias", indicesCompetencias)

  const competencias = await competenciaRepository.obtenerCompetenciasPorIndices(indicesCompetencias)

  return [
    ...habilidades,
    ...competencias
  ] 
}

export const formatearOptions = async (optionsApi: OptionsMongo[], idiomaRepository: IIdiomaRepository, competenciasRepository: ICompetenciaRepository, habilidadRepository: IHabilidadRepository, conjuroRepository: IConjuroRepository): Promise<OptionsApi[]> => {
  return await Promise.all(optionsApi.map(async optionApi => {
    const options = []
    let type = optionApi?.type
  
    if (type === 'idioma') {
      console.log("OPCIONES IDIOMA")
      console.log(optionApi)
/* 
      if (optionApi.api === 'all') {
        const idiomas = await idiomaRepository.obtenerTodos()

        options.push(...idiomas)
      } else if (isStringArray(optionApi.options)) {
        const idiomas = await idiomaRepository.obtenerIdiomasPorIndices(optionApi.options)
        options.push(...idiomas)
      }*/
    } else if (type === 'herramienta' || type === 'juego' || type === 'arma') {
      console.log("OPCIONES COMPETENCIA")
      console.log(optionApi?.api)
      /*
      if (optionApi?.api) {
        const optionsData = await competenciasRepository.obtenerCompetenciasPorType(optionApi?.api)

        options.push(
          ...optionsData
            .map(competencia => {
              return {
                index: competencia.index,
                name: competencia.name
              }
            })
        )
        
        type = optionApi?.api
      } else {
        if (isStringArray(optionApi.options)) {
          const competencias = await competenciasRepository.obtenerCompetenciasPorIndices(optionApi.options)
          
          options.push(
            ...competencias
              .map(competencia => {
                return {
                  index: competencia.index,
                  name: competencia.name
                }
              })
          )
        }
      }*/
    } else if (type === 'habilidad' || type === 'habilidad (doble bonus)') {
     console.log("OPCIONES HABILIDAD | OPCIONES HABILIDAD (DOBLE BONUS)")
     console.log(optionApi)
      /*
      if (optionApi.api === 'all') {
        options.push(
          ...habilidadRepository
            .obtenerHabilidades()
            .map(habilidad => {
              return {
                index: habilidad.index,
                name: habilidad.name
              }
            })
        )
      } else if (isStringArray(optionApi.options))  {
        options.push(
          ...habilidadRepository
            .obtenerHabilidadesPorIndices(optionApi.options)
            .map(habilidad => {
              return {
                index: habilidad.index,
                name: habilidad.name
              }
            })
        )
      }*/
    } else if (type === 'caracteristica') {
     console.log("CARACTERISTICA2")
     console.log(optionApi)
      /*
      if (isStringArray(optionApi.options))  {
        options.push(
          ...optionApi.options.map(option => {
            return {
              index: option,
              name: caracteristicas[option] ?? ''
            }
          })
        )
      }*/
    } else if (type?.split('_')[0] === 'conjuro') {
     console.log("CONJURO")
     console.log(optionApi)
      /*
      if (optionApi.api) {
        const dataApi = optionApi.api.split('_')
        const level = dataApi[0]
        const clase = dataApi[1]

        type = parseInt(level) === 0 ? 'truco' : ('conjuro nivel ' + level)

        const conjuros = await conjuroRepository.obtenerConjurosPorNivelClase(level, clase)

        options.push(
          ...conjuros
            .map(conjuro => { 
              return { 
                index: conjuro.index, 
                name: conjuro.name, 
                type: (optionApi?.type?.split('_')[1] ?? undefined),
                spell: {
                  school: conjuro.school,
                  casting_time: conjuro.casting_time,
                  range: conjuro.range,
                  components: conjuro.components,
                  duration: conjuro.duration,
                  desc: conjuro.desc,
                  ritual: conjuro.ritual
                }
              } 
            })
        )

      } else {
        if (isStringArray(optionApi.options))  {
          const conjuros = await conjuroRepository.obtenerConjurosPorIndices(optionApi.options)
          options.push(
            ...conjuros
              .map(conjuro => { return { index: conjuro.index, name: conjuro.name, type: (optionApi?.type?.split('_')[1] ?? undefined) } })
          )
        }
      }*/
    } else if (type === 'choice' && !isStringArray(optionApi.options)) {
      const newOptions = await formatearOptions(optionApi?.options, idiomaRepository, competenciasRepository, habilidadRepository, conjuroRepository)
      options.push(...newOptions)
    } else {
      console.log('Opcion no contemplada')
      console.log(optionApi)
      console.log('___________')
    } 

    options.sort((a, b) => {
      if (isNameApi(a) && isNameApi(b)) {
        return a.name.localeCompare(b?.name, 'es', { sensitivity: 'base' });
      } else if (isTypeApi(a) && isTypeApi(b)) {
        return a.type.localeCompare(b.type, 'es', { sensitivity: 'base' });
      } else {
        return 0
      }
    });

    return {
      choose: optionApi?.choose,
      type,
      options
    }
  }))
}

export const formatearSalvacion = (ability_bonuses: string[]) => {
  const abilityBonuses = ability_bonuses?.map(ability => {
    return {
      index: ability,
      name: caracteristicas[ability] ?? ability
    }
  })

  return abilityBonuses
}

export const formatearEquipamiento = (equipamientosMongo: EquipamientoPersonajeMongo[], equipamientoRepository: IEquipamientoRepository): EquipamientoPersonajeApi[] => {
  return equipamientosMongo.map(equipamientoApi => {
    const equipamiento = equipamientoRepository.obtenerEquipamientoPorIndice(equipamientoApi.index)

    const content = equipamiento.content.map(cont => {
      return {
        name: equipamientoRepository.obtenerEquipamientoPorIndice(cont?.item ?? '')?.name ?? '',
        quantity: cont.quantity
      }
    })

    return {
      index: equipamiento.index,
      name: equipamiento.name,
      quantity: equipamientoApi.quantity,
      content
    }
  })
}

export function formatearEquipamientosOptions(optionsApi: EquipamientoOpcionesMongo[][], equipamientoRepository: IEquipamientoRepository): EquipamientoOpcionesApi[][] {
  return optionsApi.map(optionApi => {
    return optionApi?.map(opt => {
      const opcion:any = {}

      if (opt?.items) {
        let content: any[] = []
        const name = opt?.items?.map((item: any) => {
          const equipamiento = equipamientoRepository.obtenerEquipamientoPorIndice(item.index)
          content = equipamiento?.content

          content = equipamiento?.content?.map((item: any) => {
            const equip = equipamientoRepository.obtenerEquipamientoPorIndice(item.item)

            return item?.quantity + 'x ' + equip?.name
          })

          return item?.quantity + 'x ' + equipamiento?.name
        })

        opcion.items = opt?.items
        opcion.name = name.join(' - ')
        opcion.content = content
      }

      if (opt?.api) {
        const valoresApi = opt?.api?.split('-')
        const equipamientoAux = equipamientoRepository.obtenerEquipamientosPorTipos(valoresApi[0], valoresApi[1], valoresApi[2])

        const options: any[] = []
  
        equipamientoAux.forEach(equip => {
          if (!options.map(op => op.index).includes(equip.index)) {
            options.push({
              index: equip?.index,
              name: equip?.name
            })
          }
        })

        const nombre = 'Cualquier ' + valoresApi[0] + ' ' + (valoresApi[1] ?? '') + ' ' + (valoresApi[2] ?? '')

        opcion.name = opcion.name ? opcion.name + ' - ' + nombre : nombre
        opcion.choose = opt?.quantity ?? 1
        opcion.options = options
      }

      if (opcion.options) {
        opcion.options.sort((a: any, b: any) => {
          if (isNameApi(a) && isNameApi(b)) {
            return a.name.localeCompare(b?.name, 'es', { sensitivity: 'base' });
          } else if (isTypeApi(a) && isTypeApi(b)) {
            return a.type.localeCompare(b.type, 'es', { sensitivity: 'base' });
          } else {
            return 0
          }
        });
      }

      return opcion
    })
  })
}

export const formatearDinero = (money: any, equipamientoRepository: IEquipamientoRepository) => {
  const data = 
    equipamientoRepository
      .obtenerEquipamientosPorIndices(money?.packs)
      .map((equip: any) => {
        const content = equip.content.map((cont: any) => {
          return {
            name: equipamientoRepository.obtenerEquipamientoPorIndice(cont?.item)?.name ?? '',
            quantity: cont.quantity
          }
        })

        return {
          index: equip.index,
          name: equip.name,
          content
        }
      })

  if (money?.money) {
    const { quantity, dice, multiply, unit } = money?.money
    const content = quantity + 'd' + dice + ' x ' + multiply + ' ' + unit

    data.push({
      index: 'money',
      name: 'Monedas',
      content 
    })
  }

  return data
}

function isStringArray(arr: any[]): arr is string[] {
  return arr.every(item => typeof item === 'string');
}

function isTypeApi(obj: any): obj is OptionsApi {
  return 'type' in obj;
}

function isNameApi(obj: any): obj is {name: string, index: string} {
  return 'name' in obj;
}