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
        const proficiency_choices = classData.data.proficiency_choices

        const proficiency = []

        proficiency_choices.forEach(prof => {
          const options = []
          let choice = false
          prof.from.options.forEach(option => {
            if (option.option_type === 'choice') {
              choice = true
              const optionsAux = []
              option.choice.from.options.forEach(option2 => {
                if (option2.item.index.includes("skill-")) {
                  optionsAux.push({
                    type: 'skill',
                    index: option2.item.index.replace("skill-", "")
                  })
                } else {
                  optionsAux.push({
                    type: 'reference',
                    index: option2.item.index
                  })
                }
              })

              options.push({
                choose: option.choice.choose,
                options: optionsAux
              })
            } else {
              if (option.item.index.includes("skill-")) {
                options.push({
                  type: 'skill',
                  index: option.item.index.replace("skill-", "")
                })
              } else {
                options.push({
                  type: 'reference',
                  index: option.item.index
                })
              }
            }
          })
          
          proficiency.push({
            choose: prof.choose,
            options,
            choice
          })
        })

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
          saving_throws: classData.data.saving_throws.map(saving => saving.index),
          proficiency_options: proficiency
        }
      }))
    }

    clases.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });
  
    res.json(clases);
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};
