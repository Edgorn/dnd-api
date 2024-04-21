const Clase = require('../models/claseModel');
const axios = require('axios');

exports.getClases = async (req, res) => {
  try {
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  
    const response = await axios.get("https://www.dnd5eapi.co/api/classes", requestOptions)

    let clasesBbdd = [];
    try {
      // Intenta recuperar datos de MongoDB
      clasesBbdd = await Clase.find();
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    const clasesAux = response.data.results.map(claseApi => {
      
      const claseAux = clasesBbdd?.find(clase => clase.index === claseApi.index)

      return {
        index: claseApi.index,
        name: claseAux?.name ?? claseApi?.name
      }
    })

    res.json(clasesAux);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};