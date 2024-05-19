const Rasgo = require('../models/rasgoModel');
const axios = require('axios');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getRasgos = async (req, res) => {
  try {
    let bbdd = false;
    let rasgos = [];

    try {
      // Intenta recuperar datos de MongoDB
      rasgos = await Rasgo.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/traits", requestOptions)
      const rasgosAux = await Promise.all(response.data.results.map(async rasgo => await axios.get("https://www.dnd5eapi.co" + rasgo.url, requestOptions)))

      rasgos = rasgosAux.map(rasgo => {
        return {
          index: rasgo.data.index,
          name: rasgo.data.name,
          desc: rasgo.data.desc
        }
      })
    }

    res.json(rasgos);

  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las rasgos' });
  }
};