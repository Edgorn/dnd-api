const Raza = require('../models/razaModel');
const axios = require('axios');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getRazas = async (req, res) => {
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

      razas = consultarRazas(razasAux2)
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

const consultarRazas = (razasApi) => {
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
      subraces: consultarSubrazas(razaApi.subraces),
      ability_bonuses: razaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }}),
      starting_proficiencies,
      options,
      languages: razaApi.languages.map(language => language.index),
      traits: razaApi?.traits?.map(trait => trait.index) ?? []
    })
  })

  return razasAux
}

const consultarSubrazas = (subrazasApi) => {
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