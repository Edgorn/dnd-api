const axios = require('axios');
const Habilidad = require('../src/infrastructure/databases/mongoDb/schemas/Habilidad');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getHabilidades = async (req, res) => {
  try {
    let bbdd = false;
    let habilidades = [];

    try {
      // Intenta recuperar datos de MongoDB
      habilidades = await Habilidad.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/skills", requestOptions)
      habilidades = await Promise.all(response.data.results.map(async habilidadApi => {
        const habilidadData = await axios.get("https://www.dnd5eapi.co" + habilidadApi.url, requestOptions)
        
        return {
          index: habilidadData.data.index,
          name: habilidadData.data.name,
          ability_score: habilidadData.data.ability_score.index
        }
      }))
    }

    habilidades.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    res.json(habilidades);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las habilidades' });
  }
};
