const Raza = require('../models/razaModel');
const Idioma = require('../models/idiomaModel');
const Rasgo = require('../models/rasgoModel');
const Habilidad = require('../models/habilidadModel');
const Competencia = require('../models/competenciaModel');
const Conjuro = require('../models/conjuroModel');
const Daño = require('../models/dañoModel');
const axios = require('axios');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

const caracteristicas = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

exports.getAllRazas = async (req, res) => {
  try {
    let bbdd = false;
    let razas = [];

    try {
      // Intenta recuperar datos de MongoDB
      razas = await Raza.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/races", requestOptions)
      const razasAux = await Promise.all(response.data.results.map(async raza => await axios.get("https://www.dnd5eapi.co" + raza.url, requestOptions)))
      const razasAux2 = await Promise.all(
        razasAux
          .map(r => r.data)
          .map(async r => {
            const subrazasAux = await Promise.all(
              r.subraces.map(async sr => {
                const subrace = await axios.get("https://www.dnd5eapi.co" + sr.url, requestOptions)

                let spell_options = null

                await Promise.all(
                  subrace.data.racial_traits.map(async rt => {
                    const trait = await axios.get("https://www.dnd5eapi.co" + rt.url, requestOptions)
                    if (trait?.data?.trait_specific?.spell_options) {
                      spell_options = trait?.data?.trait_specific?.spell_options
                    }
                  })
                )
  
                return {...subrace.data, spell_options}
              })
            )
  
            return {
              ...r,
              subraces: subrazasAux
            }
          })
      )

      razas = consultarAllRazas(razasAux2)
    }

    razas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    res.json(razas);

  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las razas' });
  }
};

exports.getRazas = async (req, res) => {
  try {
    // Intenta recuperar datos de MongoDB
    const razasApi = await Raza.find();
    const idiomasApi = await Idioma.find();
    const rasgosApi = await Rasgo.find();
    const habilidadesApi = await Habilidad.find();
    const competenciaApi = await Competencia.find();
    const conjuroApi = await Conjuro.find();
    const dañosApi = await Daño.find();

    const razas = formatearRazas(razasApi, idiomasApi, rasgosApi, habilidadesApi, competenciaApi, conjuroApi, dañosApi) ?? []

    res.json(razas);
  } catch (dbError) {
    res.status(500).json({ error: 'Error al recuperar las razas' });
  }
}

const formatearRazas = (razasApi, idiomasApi, rasgosApi, habilidadesApi, competenciaApi, conjuroApi, dañosApi) => {
  const razas = razasApi.map(raza => {
    console.log(raza.index)
    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      speed: raza.speed,
      size: raza.size,
      subraces: formatearSubrazas(raza.subraces, rasgosApi, habilidadesApi, competenciaApi, idiomasApi, conjuroApi, dañosApi),
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses),
      languages: formatearIdiomas(raza.languages, idiomasApi),
      proficiencies: formatearCompetencias(raza?.starting_proficiencies ?? [], habilidadesApi, competenciaApi),
      traits: formatearRasgos(raza?.traits, rasgosApi),
      options: formatearOptions(raza?.options, idiomasApi, competenciaApi, habilidadesApi, conjuroApi),
      spells: formatearConjuros(raza.spells, conjuroApi, rasgosApi),
      resistances: formatearResistencias(raza.resistances, dañosApi)
    }
  })

  razas.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

  return razas
}

const formatearSubrazas = (subrazasApi, rasgosApi, habilidadesApi, competenciaApi, idiomasApi, conjuroApi, dañosApi) => {
  const subrazas = subrazasApi.map(subraza => {
    
    console.log(subraza.index)
    return {
      index: subraza.index,
      name: subraza.name,
      desc: subraza.desc,
      speed: subraza.speed,
      types: subraza?.types?.map(type => {
        return {
          name: type.name,
          desc: type.desc
        }
      }),
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses),
      proficiencies: formatearCompetencias(subraza?.starting_proficiencies ?? [], habilidadesApi, competenciaApi),
      traits: formatearRasgos(subraza?.traits, rasgosApi),
      options: formatearOptions(subraza?.options, idiomasApi, competenciaApi, habilidadesApi, conjuroApi),
      spells: formatearConjuros(subraza?.spells, conjuroApi, rasgosApi),
      resistances: formatearResistencias(subraza?.resistances, dañosApi)
    }
  })

  subrazas.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    if (a.name > b.name) {
      return 1;
    }
    return 0;
  });

  return subrazas
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

const formatearOptions = (optionsApi, idiomasApi, competenciaApi, habilidadesApi, conjuroApi) => {
  return optionsApi.map(optionApi => {

    const options = []

    if (optionApi?.type === 'idioma') {
      optionApi.options.forEach(option => {

        const idioma = idiomasApi.find(idioma => idioma.index === option)

        options.push({
          index: idioma.index,
          name: idioma.name
        })
      })
    } else if (optionApi?.type === 'herramienta') {
      optionApi.options.forEach(option => {

        const competencia = competenciaApi.find(competencia => competencia.index === option)

        options.push({
          index: competencia.index,
          name: competencia.name
        })
      })
    } else if (optionApi?.type === 'habilidad') {
      optionApi.options.forEach(option => {

        const habilidad = habilidadesApi.find(habilidad => habilidad.index === option)

        options.push({
          index: habilidad.index,
          name: habilidad.name
        })
      })
    } else if (optionApi?.type === 'caracteristica') {
      optionApi.options.forEach(option => {
        options.push({
          index: option,
          name: caracteristicas[option] ?? ''
        })
      })
    } else if (optionApi?.type?.split('_')[0] === 'conjuro') {
      optionApi.options.forEach(option => {
        const conjuro = conjuroApi.find(conjuro => conjuro.index === option)

        options.push({
          index: conjuro.index,
          name: conjuro.name
        })
      })
    } else {
      console.log(optionApi)
    }

    return {
      choose: optionApi?.choose,
      type: optionApi?.type,
      options
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

const consultarAllRazas = (razasApi) => {
  const razasAux = []

  razasApi.forEach(razaApi => {
    const starting_proficiencies = []

    razaApi.starting_proficiencies.forEach(profiency => {
      if (profiency.index.includes("skill-")) {
        starting_proficiencies.push({
          type: 'skill',
          index: profiency.index.replace("skill-", "")
        })
      } else {
        starting_proficiencies.push({
          type: 'reference',
          index: profiency.index
        })
      }
    })

    const proficiency_options = []
    let type = 'reference'

    razaApi?.starting_proficiency_options?.from?.options?.forEach(option => {
      if (option.item.index.includes("skill-")) {
        type = 'skill'
        proficiency_options.push(option.item.index.replace("skill-", ""))
      } else {
        type = 'reference'
        proficiency_options.push(option.item.index)
      }
    })

    const options = []

    if (razaApi?.starting_proficiency_options) {
      options.push({
        choose: razaApi?.starting_proficiency_options?.choose,
        options: proficiency_options,
        type
      })
    }

    if (razaApi?.language_options) {
      const languages = razaApi.language_options.from.options.map(language => language.item.index)

      options.push({
        choose: razaApi?.language_options?.choose,
        options: languages,
        type: 'language'
      })
    }

    if (razaApi?.ability_bonus_options) {
      const abilities = razaApi.ability_bonus_options.from.options.map(ability => ability.ability_score.index)

      options.push({
        choose: razaApi?.ability_bonus_options?.choose,
        options: abilities,
        type: 'ability'
      })
    }

    razasAux.push({
      index: razaApi.index,
      name: razaApi.name,
      desc: '',
      speed: razaApi.speed,
      size: razaApi.size,
      subraces: consultarAllSubrazas(razaApi.subraces),
      ability_bonuses: razaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }}),
      starting_proficiencies,
      options,
      languages: razaApi.languages.map(language => language.index),
      traits: razaApi?.traits?.map(trait => trait.index) ?? []
    })
  })

  return razasAux
}

const consultarAllSubrazas = (subrazasApi) => {
  const subrazasAux = []

  subrazasApi.forEach(subrazaApi => {
    const starting_proficiencies = []

    subrazaApi.starting_proficiencies.forEach(profiency => {
      if (profiency.index.includes("skill-")) {
        starting_proficiencies.push({
          type: 'skill',
          index: profiency.index.replace("skill-", "")
        })
      } else {
        starting_proficiencies.push({
          type: 'reference',
          index: profiency.index
        })
      }
    })

    const options = []

    if (subrazaApi?.language_options) {
      const languages = subrazaApi.language_options.from.options.map(language => language.item.index)

      options.push({
        choose: subrazaApi?.language_options?.choose,
        options: languages,
        type: 'language'
      })
    }

    if (subrazaApi?.spell_options) {
      const spells = subrazaApi.spell_options.from.options.map(spell => spell.item.index)
      
      options.push({
        choose: subrazaApi?.spell_options?.choose,
        options: spells,
        type: 'spell-int'
      })
    }

    subrazasAux.push({
      index: subrazaApi.index,
      name: subrazaApi?.name,
      desc: subrazaApi.desc,
      ability_bonuses: subrazaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }}),
      starting_proficiencies,
      options,
      traits: subrazaApi?.racial_traits?.map(trait => trait.index) ?? []
    })
  })

  return subrazasAux
}