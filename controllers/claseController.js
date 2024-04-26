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

      clases = await Promise.all(response.data.results.map(async claseApi => {
        const classData = await axios.get(`https://www.dnd5eapi.co/api/classes/${claseApi.index}`, requestOptions)
        const classLevels = await axios.get(`https://www.dnd5eapi.co/api/classes/${claseApi.index}/levels`, requestOptions)
        console.log(classData.data.saving_throws.map(saving => saving.index))

        const levels = classLevels.data.map(level => {
          return {
            level: level.level,
            prof_bonus: level.prof_bonus
          }
        })

        return {
          index: claseApi.index,
          name: claseApi?.name,
          levels,
          saving_throws: classData.data.saving_throws.map(saving => saving.index)
        }
      }))
    }
  
    res.json(clases);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};
