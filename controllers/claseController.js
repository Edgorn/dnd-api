const Clase = require('../models/claseModel');
const Habilidad = require('../models/habilidadModel');
const Competencia = require('../models/competenciaModel');
const axios = require('axios');
const { formatearCompetencias, formatearOptions, formatearEquipamientosOptions, formatearRasgos, formatearDinero, formatearConjuros } = require('../helpers/formatDataHelpers');
const Idioma = require('../models/idiomaModel');
const Conjuro = require('../models/conjuroModel');
const Equipamiento = require('../models/equipamientoModel');
const Rasgo = require('../models/rasgoModel');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

const caracteristicas = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

exports.getAllClases = async (req, res) => {
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

exports.getClases = async (req, res) => {
  try {
    const clasesApi = await Clase.find();
    const habilidadesApi = await Habilidad.find();
    const competenciaApi = await Competencia.find();
    const idiomasApi = await Idioma.find();
    const conjuroApi = await Conjuro.find();
    const equipamientApi = await Equipamiento.find();
    const rasgosApi = await Rasgo.find();

    const clases = formatearClases(clasesApi, habilidadesApi, competenciaApi, idiomasApi , conjuroApi, equipamientApi, rasgosApi) ?? []
    
    res.json(clases); 
    
  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};

const formatearClases = (clasesApi, habilidadesApi, competenciaApi, idiomasApi , conjuroApi, equipamientoApi, rasgosApi) => {
  const clases = clasesApi.map(clase => {

    const equipamientoClase = []

    clase.starting_equipment.forEach(equipment => {
      const equipamiento = equipamientoApi.find(equi => equi.index === equipment.index)

      equipamientoClase.push({
        index: equipamiento.index,
        name: equipamiento.name,
        quantity: equipment.quantity
      })
    })

    const traits = []
    const spellOptions = []
    const subclasesOptions = []

    clase.levels
      .filter(level => level.level <= 1)
      .forEach(level => {
        const subclases_options = level?.subclasses_options?.map(sub => {
          const options = sub?.options?.map(opt => {
            const subclase = level?.subclasses[opt.index]
            const spells = []

            subclase?.spells?.forEach(spell => {
              const conjuro = conjuroApi.find(conj => conj.index === spell)

              spells.push({
                index: conjuro.index,
                name: conjuro.name
              })
            })

            return {
              ...opt,
              traits: formatearRasgos(subclase?.traits ?? [], rasgosApi),
              spells
            }
          })

          return {
            ...sub,
            options
          }
        })

        traits.push(...level.traits)
        spellOptions.push(...level?.spellcasting?.options ?? [])
        subclasesOptions.push(...subclases_options ?? [])
      })
    
    return {
      index: clase.index,
      name: clase.name,
      desc: clase?.desc ?? '',
      hit_die: clase.hit_die ?? 0,
      proficiencies: formatearCompetencias(clase.starting_proficiencies, habilidadesApi, competenciaApi),
      saving_throws: clase?.saving_throws?.map(sav => { return { index: sav, name: caracteristicas[sav] } }) ?? [],
      options: formatearOptions(clase.options, idiomasApi, competenciaApi, habilidadesApi, conjuroApi),
      equipment: equipamientoClase,
      equipment_options: formatearEquipamientosOptions(clase?.starting_equipment_options ?? [], equipamientoApi),
      traits: formatearRasgos(traits, rasgosApi),
      money: formatearDinero(clase.money, equipamientoApi),
      spellcasting_options: formatearOptions(spellOptions, idiomasApi, competenciaApi, habilidadesApi, conjuroApi),
      subclases_options: subclasesOptions
    }
  })

  clases.sort((a, b) => {
    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
  });

  return clases
}