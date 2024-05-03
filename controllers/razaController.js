const Raza = require('../models/razaModel');
const axios = require('axios');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

// REVISAR HABILIDADES SEMIELFOS

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
  
                return subrace.data
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

    razaApi?.starting_proficiency_options?.from?.options?.forEach(option => {
      if (option.item.index.includes("skill-")) {
        proficiency_options.push({
          type: 'skill',
          index: option.item.index.replace("skill-", "")
        })
      } else {
        proficiency_options.push({
          type: 'reference',
          index: option.item.index
        })
      }
    })

    razasAux.push({
      index: razaApi.index,
      name: razaApi.name,
      subraces: consultarSubrazas(razaApi.subraces),
      ability_bonuses: razaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }}),
      starting_proficiencies,
      starting_proficiency_options: (
        razaApi?.starting_proficiency_options
        ?
        {
          choose: razaApi?.starting_proficiency_options?.choose,
          options: proficiency_options,
          choice: false
        }
        :
        undefined
      )
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

    subrazasAux.push({
      index: subrazaApi.index,
      name: subrazaApi?.name,
      ability_bonuses: subrazaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }}),
      starting_proficiencies
    })
  })

  return subrazasAux
}