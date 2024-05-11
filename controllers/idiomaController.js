const axios = require('axios');
const Idioma = require('../models/idiomaModel');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getIdiomas = async (req, res) => {
  try {
    let bbdd = false;
    let idiomas = [];

    try {
      // Intenta recuperar datos de MongoDB
      idiomas = await Idioma.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/languages", requestOptions)
      idiomas = await Promise.all(response.data.results.map(async idiomaApi => {
        const idiomaData = await axios.get("https://www.dnd5eapi.co" + idiomaApi.url, requestOptions)
        
        return {
          index: idiomaData.data.index,
          name: idiomaData.data.name,
          type: idiomaData.data.type,
          typical_speakers: idiomaData.data.typical_speakers,
          script: idiomaData.data.script,
        }
      }))
    }


    res.json(idiomas);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las lenguajes' });
  }
};
