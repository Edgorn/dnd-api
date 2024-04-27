const Transfondo = require('../models/transfondoModel');
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

      transfondos = response.data.results.map(transfondoApi => {
        return {
          index: transfondoApi.index,
          name: transfondoApi?.name
        }
      })
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