const axios = require('axios');
const Daños = require('../src/infrastructure/databases/mongoDb/schemas/Daño');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getDaños = async (req, res) => {
  try {
    let bbdd = false;
    let daños = [];

    try {
      // Intenta recuperar datos de MongoDB
      daños = await Daños.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/damage-types", requestOptions)
      daños = await Promise.all(response.data.results.map(async dañoApi => {
        const dañoData = await axios.get("https://www.dnd5eapi.co" + dañoApi.url, requestOptions)

        return {
          index: dañoData.data.index,
          name: dañoData.data.name,
          desc: dañoData.data.desc
        }
      }))
    }

    res.json(daños);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las lenguajes' });
  }
};
