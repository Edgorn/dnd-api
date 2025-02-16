import ICompetenciaRepository from "../domain/repositories/ICompetenciaRepository"
import IConjuroRepository from "../domain/repositories/IConjuroRepository"
import IEquipamientoRepository from "../domain/repositories/IEquipamientoRepository"
import IHabilidadRepository from "../domain/repositories/IHabilidadRepository"
import IIdiomaRepository from "../domain/repositories/IIdiomaRepository"
import IRasgoRepository from "../domain/repositories/IRasgoRepository"
import { AbilityBonusesApi, AbilityBonusesMongo, OptionsApi, OptionsMongo, ProficienciesApi, ProficienciesMongo } from "../domain/types"

const caracteristicas: {[key: string]: string} = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
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

export const formatearConjuros = (spellsApi: string[], conjuroRepository: IConjuroRepository, rasgoRepository: IRasgoRepository) => {
  const conjuros = spellsApi.map(spell => {
    const arraySpell = spell.split('_')
    const conjuro = conjuroRepository.obtenerConjuroPorIndice(arraySpell[0])

    if (!conjuro) {
      return null;
    }

    const caracteristica = caracteristicas[arraySpell[1]] 

    let tipo = ''

    if (caracteristica) {
      tipo = caracteristica
    } else {
      const rasgo = rasgoRepository.obtenerRasgoPorIndice(arraySpell[1])
      tipo = rasgo.name
    }

    return {
      ...conjuro,
      type: arraySpell[1],
      typeName: tipo
    }
  })
  .filter(conjuro => conjuro !== null);

  return conjuros
}

export const formatearCompetencias = (proficiencies: ProficienciesMongo[], habilidadRepository: IHabilidadRepository, competenciaRepository: ICompetenciaRepository): ProficienciesApi[] => {
  const indicesHabilidades = 
    proficiencies
      .filter(proficiency => proficiency.type === 'habilidad')
      .map(proficiency => proficiency.index)

  const habilidades = 
    habilidadRepository
      .obtenerHabilidadesPorIndices(indicesHabilidades)
      .map(habilidad => {
        return {
          index: habilidad?.index,
          name: habilidad?.name,
          type: 'habilidad'
        }
      })

  const indicesCompetencias =
    proficiencies
      .filter(proficiency => proficiency.type !== 'habilidad')
      .map(proficiency => proficiency.index)

  const competencias = competenciaRepository
    .obtenerCompetenciasPorIndices(indicesCompetencias)

  return [
    ...habilidades,
    ...competencias
  ] 
}

export const formatearOptions = (optionsApi: OptionsMongo[], idiomaRepository: IIdiomaRepository, competenciasRepository: ICompetenciaRepository, habilidadRepository: IHabilidadRepository, conjuroRepository: IConjuroRepository): OptionsApi[] => {
  return optionsApi.map(optionApi => {
    const options = []
    let type = optionApi?.type

    if (type === 'idioma') {
      if (optionApi.api === 'all') {
        options.push(
          ...idiomaRepository
            .obtenerIdiomas()
            .map(idioma => {
              return {
                index: idioma.index,
                name: idioma.name
              }
            })
        )
      } else if (isStringArray(optionApi.options)) {
        options.push(
          ...idiomaRepository
            .obtenerIdiomasPorIndices(optionApi.options)
            .map(idioma => {
              return {
                index: idioma.index,
                name: idioma.name
              }
            })
        )
      }
    } else if (type === 'herramienta' || type === 'juego') {
      if (optionApi?.api) {
        options.push(
          ...competenciasRepository
            .obtenerCompetenciasPorType(optionApi?.api)
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
          options.push(
            ...competenciasRepository
              .obtenerCompetenciasPorIndices(optionApi.options)
              .map(competencia => {
                return {
                  index: competencia.index,
                  name: competencia.name
                }
              })
          )
        }
      }
    } else if (type === 'habilidad' || type === 'habilidad (doble bonus)') {
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
      }
    } else if (type === 'caracteristica') {
      if (isStringArray(optionApi.options))  {
        options.push(
          ...optionApi.options.map(option => {
            return {
              index: option,
              name: caracteristicas[option] ?? ''
            }
          })
        )
      }
    } else if (type?.split('_')[0] === 'conjuro') {
      if (optionApi.api) {
        const dataApi = optionApi.api.split('_')
        const level = dataApi[0]
        const clase = dataApi[1]

        type = parseInt(level) === 0 ? 'truco' : ('conjuro nivel ' + level)


        options.push(
          ...conjuroRepository
            .obtenerConjurosPorNivelClase(level, clase)
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
          options.push(
            ...conjuroRepository
              .obtenerConjurosPorIndices(optionApi.options)
              .map(conjuro => { return { index: conjuro.index, name: conjuro.name, type: (optionApi?.type?.split('_')[1] ?? undefined) } })
          )
        }
      }
    } else if (type === 'choice' && !isStringArray(optionApi.options)) {
      options.push(...formatearOptions(optionApi?.options, idiomaRepository, competenciasRepository, habilidadRepository, conjuroRepository))
    } else {
      console.log('HOLA')
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
  })
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

export const formatearEquipamiento = (equipamientosApi: any[], equipamientoRepository: IEquipamientoRepository) => {
  return equipamientosApi.map(equipamientoApi => {
    const equipamiento = equipamientoRepository.obtenerEquipamientoPorIndice(equipamientoApi.index)

    const content = equipamiento.content.map((cont: any) => {
      return {
        name: equipamientoRepository.obtenerEquipamientoPorIndice(cont?.item)?.name ?? '',
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

export const formatearEquipamientosOptions = (optionsApi: any[], equipamientoRepository: IEquipamientoRepository) => {
  return optionsApi.map(optionApi => {
    return optionApi?.map((opt: any) => {
      const opcion: any = {}

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
        opcion.choose = opt?.quantity
        opcion.options = options
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