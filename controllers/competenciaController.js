const axios = require('axios');
const Competencia = require('../src/infrastructure/databases/mongoDb/schemas/Competencia');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getCompetencias = async (req, res) => {
  try {
    let bbdd = false;
    let competencias = [];

    try {
      // Intenta recuperar datos de MongoDB
      competencias = await Competencia.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {

      const response = await axios.get("https://www.dnd5eapi.co/api/proficiencies", requestOptions)
      const competenciasFiltradas = response.data.results
        .filter(competenciaApi => competenciaApi.index.split('-')[0] !== 'skill' && competenciaApi.index.split('-')[0] !== 'saving')

      competencias = await Promise.all(
        competenciasFiltradas.map(async competenciaApi => {
          const competenciaData = await axios.get("https://www.dnd5eapi.co" + competenciaApi.url, requestOptions)

          return {
            index: competenciaData.data.index,
            name: competenciaData.data.name,
            type: competenciaData.data.type
          }
        })
      )
    }

    res.json(competencias);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las habilidades' });
  }
};
