const caracteristicas = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

const formatearAbilityBonuses = (ability_bonuses) => {
  const abilityBonuses = ability_bonuses?.map(ability => {
    return {
      index: ability?.index,
      name: caracteristicas[ability?.index] ?? ability.index,
      bonus: ability?.bonus
    }
  })

  return abilityBonuses
}

const formatearIdiomas = (languagesApi, idiomasApi) => {
  const languages = languagesApi?.map(language => {
    const idioma = idiomasApi.find(idioma => idioma.index === language)
    return {
      index: idioma?.index,
      name: idioma?.name
    }
  })

  return languages
}

const formatearRasgos = (traitsApi, rasgosApi) => {
  const traits = []
  
  traitsApi?.forEach(trait => {
    const rasgo = rasgosApi.find(rasgo => rasgo.index === trait)

    if (!traits?.includes(rasgo?.discard)) {
      traits.push({
        index: rasgo?.index,
        name: rasgo?.name,
        desc: rasgo?.desc?.join('\n')
      })
    }
  })

  return traits
}

const formatearCompetencias = (proficiencies, habilidadesApi, competenciaApi) => {
  const habilidades = proficiencies.map(proficiency => {
    if (proficiency.type === 'habilidad') {
      const habilidad = habilidadesApi.find(habilidad => habilidad.index === proficiency.index)

      return {
        index: habilidad?.index,
        name: habilidad?.name,
        type: 'habilidad'
      }
    } else {
      const competencia = competenciaApi.find(competencia => competencia.index === proficiency.index)

      return {
        index: competencia?.index,
        name: competencia?.name,
        type: competencia?.type
      }
    }
  })

  return habilidades
}

const formatearOptions = (optionsApi, idiomasApi, competenciasApi, habilidadesApi, conjuroApi) => {
  return optionsApi.map(optionApi => {
    const options = []
    let type = optionApi?.type

    if (optionApi?.type === 'idioma') {
      if (optionApi.api === 'all') {
        options.push(...idiomasApi.map(idioma => { return { index: idioma.index, name: idioma.name } }))
      } else {
        optionApi.options.forEach(option => {
          const idioma = idiomasApi.find(idioma => idioma.index === option)
  
          options.push({
            index: idioma.index,
            name: idioma.name
          })
        })
      }
    } else if (optionApi?.type === 'herramienta') {
      if (optionApi?.api) {
        const competencias = competenciasApi.filter(competencia => competencia.type === optionApi?.api)
        options.push(...competencias.map(competencia => { return { index: competencia.index, name: competencia.name } }))
        type = 'instrumento'
      } else {
        optionApi.options.forEach(option => {
          const competencia = competenciasApi.find(competencia => competencia.index === option)
  
          options.push({
            index: competencia.index,
            name: competencia.name
          })
        })
      }
    } else if (optionApi?.type === 'habilidad') {
      if (optionApi.api === 'all') {
        options.push(...habilidadesApi.map(habilidad => { return { index: habilidad.index, name: habilidad.name } }))
      } else {
        optionApi.options.forEach(option => {
          const habilidad = habilidadesApi.find(habilidad => habilidad.index === option)

          options.push({
            index: habilidad.index,
            name: habilidad.name
          })
        })
      }
    } else if (optionApi?.type === 'caracteristica') {
      optionApi.options.forEach(option => {
        options.push({
          index: option,
          name: caracteristicas[option] ?? ''
        })
      })
    } else if (optionApi?.type?.split('_')[0] === 'conjuro') {
      if(optionApi.api) {
        const dataApi = optionApi.api.split('_')
        const level = dataApi[0]
        const clase = dataApi[1]

        type = parseInt(level) === 0 ? 'truco' : 'conjuro'

        options.push(
          ...conjuroApi
            .filter(conjuro => conjuro.level === parseInt(level))
            .filter(conjuro => conjuro.classes.includes(clase))
            .map(conjuro => { return { index: conjuro.index, name: conjuro.name } })
        )
      
      } else {
        optionApi.options.forEach(option => {
          const conjuro = conjuroApi.find(conjuro => conjuro.index === option)
  
          options.push({
            index: conjuro.index,
            name: conjuro.name
          })
        })
      }
    } else {
      /*console.log(optionApi.type)
      console.log('___________')*/
    }

    options.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return {
      choose: optionApi?.choose,
      type,
      options
    }
  })
}

const formatearEquipamientosOptions = (optionsApi, equipamientoApi) => {
  return optionsApi.map(optionApi => {
    const options = []
    let type = ''

    optionApi?.options?.forEach(option => {

      if (option?.items) {
        const index = []
        const name = []
        const quantity = []

        option?.items?.forEach(item => {
          const equipamiento = equipamientoApi.find(eq => eq.index === item.index)
          type = equipamiento?.category?.toLowerCase()

          index.push(item.index)
          name.push(equipamiento?.name ?? '')
          quantity.push(item?.quantity ?? '')
        })

        options.push({
          index,
          name,
          quantity
        })
        
      } else if (option?.api) {
        const valoresApi = option?.api?.split('-')

        let equipamientoAux = equipamientoApi

        if (valoresApi[0]) {
          type = valoresApi[0]
          equipamientoAux = equipamientoAux.filter(eq => eq?.category?.toLowerCase() === valoresApi[0])
        }

        if (valoresApi[1]) {
          equipamientoAux = equipamientoAux.filter(eq => eq?.weapon?.category?.toLowerCase() === valoresApi[1])
        }

        if (valoresApi[2]) {
          equipamientoAux = equipamientoAux.filter(eq => eq?.weapon?.range?.toLowerCase() === valoresApi[2])
        }

        equipamientoAux.forEach(equip => {
          
          if (!options.map(op => op.index).includes(equip.index)) {
            options.push({
              index: [equip?.index],
              name: [equip?.name],
              quantity: [option?.quantity]
            })
          }
        })

      } else {
        const equipamiento = equipamientoApi.find(eq => eq.index === option.index)
        type = equipamiento?.category?.toLowerCase()
        options.push({
          index: [option?.index],
          name: [equipamiento?.name ?? ''],
          quantity: [option?.quantity ?? '']
        })
      }
    })
    
    return {
      choose: optionApi?.choose,
      options,
      type
    }
  })
}

const formatearConjuros = (spellsApi, conjuroApi, rasgosApi) => {
  const conjuros = spellsApi.map(spell => {
    const arraySpell = spell.split('_')
    const conjuro = conjuroApi.find(conjuro => conjuro.index === arraySpell[0])
    const caracteristica = caracteristicas[arraySpell[1]]

    let tipo = ''

    if (caracteristica) {
      tipo = caracteristica
    } else {
      const rasgo = rasgosApi.find(rasgo => rasgo.index === arraySpell[1])
      tipo = rasgo.name
    }

    return {
      index: conjuro.index,
      name: conjuro.name,
      type: arraySpell[1],
      typeName: tipo
    }
  })

  return conjuros
}

const formatearResistencias = (resistancesApi, dañosApi) => {
  const resistencias = resistancesApi.map(resistance => {
    const daño = dañosApi.find(daño => daño.index === resistance)

    return {
      index: daño.index,
      name: daño.name
    }
  })

  return resistencias
}

const formatearDinero = (money, equipamientoApi) => {
  const data = []

  money?.packs?.forEach(pack => {
    const equipamiento = equipamientoApi.find(eq => eq.index === pack)
    data.push({
      index: pack,
      name: equipamiento?.name ?? ''
    })
  })
  
  if (money?.money) {
    const { quantity, dice, multiply, unit } = money?.money
    const name = quantity + 'd' + dice + ' x ' + multiply + ' ' + unit

    data.push({
      index: 'money',
      name 
    })
  }

  return data
}

module.exports = {
  formatearAbilityBonuses,
  formatearIdiomas,
  formatearRasgos,
  formatearCompetencias,
  formatearOptions,
  formatearConjuros,
  formatearResistencias,
  formatearEquipamientosOptions,
  formatearDinero
};