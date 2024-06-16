const Transfondo = require('../src/infrastructure/databases/mongoDb/schemas/Transfondo');
const axios = require('axios');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getTransfondos = async (req, res) => {
  try {
    let bbdd = false
    let transfondos = [];

    try {
      // Intenta recuperar datos de MongoDB
      transfondos = await Transfondo.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.log(dbError)
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/backgrounds", requestOptions)

      transfondos = await Promise.all(response.data.results.map(async transfondoApi => {
        const transfondoData = await axios.get("https://www.dnd5eapi.co" + transfondoApi.url, requestOptions)

        const starting_proficiencies = []

        transfondoData.data.starting_proficiencies.forEach((prof) => {
          if (prof.index.includes("skill-")) {
            starting_proficiencies.push({
              type: 'skill',
              index: prof.index.replace("skill-", "")
            })
          } else {
            starting_proficiencies.push({
              type: 'reference',
              index: prof.index
            })
          }
        })

        const options = []

        if (transfondoData?.data?.language_options) {
          const url = transfondoData?.data?.language_options.from.resource_list_url
          const languageData = await axios.get("https://www.dnd5eapi.co" + url, requestOptions)
  
          const optionsLanguage = languageData.data.results.map(language => language.index)

          options.push({
            choose: transfondoData?.data?.language_options?.choose,
            options: optionsLanguage,
            type: 'language'
          })
        }

        return {
          index: transfondoApi.index,
          name: transfondoApi?.name,
          starting_proficiencies,
          options
        }
      }))
    }

    transfondos.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    res.json(transfondos);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};