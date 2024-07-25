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

const formatearCompetencias = (proficiencies, habilidadRepository, competenciaRepository) => {
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

const formatearOptions = (optionsApi, idiomaRepository, competenciasRepository, habilidadRepository, conjuroRepository) => {

  return optionsApi.map(optionApi => {
    const options = []
    let type = optionApi?.type

    if (type === 'idioma') {
      if (optionApi.api === 'all') {
        options.push(...idiomaRepository.obtenerIdiomas())
      } else {
        options.push(...idiomaRepository.obtenerIdiomasPorIndices(optionApi.options))
      }
    } else if (type === 'herramienta') {
      if (optionApi.api === 'all') {
        options.push(
          ...competenciasRepository
            .obtenerCompetencias()
            .map(competencia => {
              return {
                index: competencia.index,
                name: competencia.name
              }
            })
        )
        type = 'instrumento'
      } else {
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
    } else if (type === 'habilidad' || type === 'habilidad (doble bonus)') {
      if (optionApi.api === 'all') {
        options.push(...habilidadRepository.obtenerHabilidades())
      } else {
        options.push(...habilidadRepository.obtenerHabilidadesPorIndices(optionApi.options))
      }
    } else if (type === 'caracteristica') {
      options.push(
        ...optionApi.options.map(option => {
          return {
            index: option,
            name: caracteristicas[option] ?? ''
          }
        })
      )
    } else if (type?.split('_')[0] === 'conjuro') {
      if (optionApi.api) {
        const dataApi = optionApi.api.split('_')
        const level = dataApi[0]
        const clase = dataApi[1]

        type = parseInt(level) === 0 ? 'truco' : 'conjuro'

        options.push(
          ...conjuroRepository
            .obtenerConjurosPorNivelClase(level, clase)
            .map(conjuro => { return { index: conjuro.index, name: conjuro.name, type: (optionApi?.type?.split('_')[1] ?? undefined) } })
        )

      } else {
        options.push(
          ...conjuroRepository
            .obtenerConjurosPorIndices(optionApi.options)
            .map(conjuro => { return { index: conjuro.index, name: conjuro.name, type: (optionApi?.type?.split('_')[1] ?? undefined) } })
        )
      }
    } else if (type === 'choice') {
      options.push(...formatearOptions(optionApi?.options, idiomaRepository, competenciasRepository, habilidadRepository, conjuroRepository))
    } else {
      console.log(optionApi)
      console.log('___________')
    }


    options.sort((a, b) => {
      if (a?.name) {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      } else {
        return a.type.localeCompare(b.type, 'es', { sensitivity: 'base' });
      }
    });

    return {
      choose: optionApi?.choose,
      type,
      options
    }
  })
}

const formatearConjuros = (spellsApi, conjuroRepository, rasgoRepository) => {
  const conjuros = spellsApi.map(spell => {
    const arraySpell = spell.split('_')
    const conjuro = conjuroRepository.obtenerConjuroPorIndice(arraySpell[0])
    const caracteristica = caracteristicas[arraySpell[1]] 

    let tipo = ''

    if (caracteristica) {
      tipo = caracteristica
    } else {
      const rasgo = rasgoRepository.obtenerRasgoPorIndice(arraySpell[1])
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


module.exports = {
  formatearAbilityBonuses,
  formatearCompetencias,
  formatearOptions,
  formatearConjuros
};