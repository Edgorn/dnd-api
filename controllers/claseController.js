const Clase = require('../models/claseModel');
const axios = require('axios');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getClases = async (req, res) => {
  try {
    let bbdd = false;
    let clases = [];

    try {
      // Intenta recuperar datos de MongoDB
      clases = await Clase.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/classes", requestOptions)

      clases = response.data.results.map(claseApi => {
        return {
          index: claseApi.index,
          name: claseApi?.name
        }
      })
    }
  
    res.json(clases);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};

exports.getClaseNivel = async (req, res) => {
  try {
    const clase = req.params.clase;
    const nivel = req.params.nivel;

    let datos = {}
    let bbdd = false;

    if (!bbdd) {
      const response = await axios.get(`https://www.dnd5eapi.co/api/classes/${clase}/levels/${nivel}`, requestOptions)
      datos = response.data
    }
  
    res.json(datos);
    
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};