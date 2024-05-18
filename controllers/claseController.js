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
          let type = ''
          prof.from.options.forEach(option => {
            if (option.option_type === 'choice') {
              type = 'choice'
              let typeAux = ''
              const optionsAux = []
              option.choice.from.options.forEach(option2 => {
                if (option2.item.index.includes("skill-")) {
                  typeAux = 'skill'
                  optionsAux.push(option2.item.index.replace("skill-", ""))
                } else {
                  typeAux = 'reference'
                  optionsAux.push(option2.item.index)
                }
              })

              options.push({
                choose: option.choice.choose,
                options: optionsAux,
                type: typeAux
              })
            } else {
              if (option.item.index.includes("skill-")) {
                type = 'skill'
                options.push(option.item.index.replace("skill-", ""))
              } else {
                type = 'reference'
                options.push(option.item.inde)
              }
            }
          })
          
          proficiency.push({
            choose: prof.choose,
            options,
            type
          })
        })

        const levels = classLevels.data.map(level => {
          return {
            level: level.level,
            prof_bonus: level.prof_bonus
          }
        })

        const starting_proficiencies = classData?.data?.proficiencies
          .filter(prof => prof.index.split('-')[0] !== 'saving')
          .map(prof => {
            return {
              type: 'reference',
              index: prof.index
            }
          })

        return {
          index: claseApi.index,
          name: claseApi?.name,
          levels,
          saving_throws: classData.data.saving_throws.map(saving => saving.index),
          options: proficiency,
          starting_proficiencies
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
