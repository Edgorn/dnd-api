const Transfondo = require('../models/transfondoModel');
const axios = require('axios');

exports.getTransfondos = async (req, res) => {
  try {
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  
    const response = await axios.get("https://www.dnd5eapi.co/api/backgrounds", requestOptions)

    let transfondosBbdd = [];

    try {
      // Intenta recuperar datos de MongoDB
      transfondosBbdd = await Transfondo.find();
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    let transfondosAux = response.data.results.map(transfondoApi => {
      const transfondoAux = transfondosBbdd.find(transfondo => transfondo.index === transfondoApi.index)
      transfondosBbdd = transfondosBbdd.filter(transfondo => transfondo.index !== transfondoApi.index)
      
      return {
        index: transfondoApi.index,
        name: transfondoAux?.name ?? transfondoApi?.name
      }
    })

    transfondosAux = transfondosAux.concat(transfondosBbdd.map(transfondo => ( { index: transfondo.index, name: transfondo.name } )))

    res.json(transfondosAux);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};