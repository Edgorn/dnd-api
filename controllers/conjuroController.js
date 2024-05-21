const axios = require('axios');
const Conjuro = require('../models/conjuroModel');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getConjuros = async (req, res) => {
  try {
    let bbdd = false;
    let conjuros = [];

    try {
      // Intenta recuperar datos de MongoDB
      conjuros = await Conjuro.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/spells", requestOptions)
      conjuros = await Promise.all(response.data.results.map(async conjuroApi => {
        const conjuroData = await axios.get("https://www.dnd5eapi.co" + conjuroApi.url, requestOptions)
        
        return {
          index: conjuroData.data.index,
          name: conjuroData.data.name,
          level: conjuroData.data.level
        }
      }))
    }

    res.json(conjuros);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las conjuros' });
  }
};
