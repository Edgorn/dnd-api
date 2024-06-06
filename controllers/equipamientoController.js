//const Rasgo = require('../models/rasgoModel');
const axios = require('axios');
const Equipamiento = require('../models/equipamientoModel');

const requestOptions = {
  headers: {
    'Content-Type': 'application/json'
  }
};

exports.getAllEquipamientos = async (req, res) => {
  try {
    let bbdd = false;
    let equipamientos = [];

    const tipoArmadura = {
      Light: "Ligera",
      Medium: "Media",
      Heavy: "Pesada",
      Shield: "Escudo"
    }

    try {
      // Intenta recuperar datos de MongoDB
      equipamientos = await Equipamiento.find();
      bbdd = true
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    if (!bbdd) {
      const response = await axios.get("https://www.dnd5eapi.co/api/equipment", requestOptions)
      const equipamientosAux = await Promise.all(response.data.results.map(async equipamiento => await axios.get("https://www.dnd5eapi.co" + equipamiento.url, requestOptions)))
      
      const equipamientosList = equipamientosAux.map(equipamiento => {
        const actualEquip = equipamientos.find(eq => eq.index === equipamiento.data.index)
        const category = equipamiento?.data?.equipment_category?.index

        let categoria = ''
        let weapon = {}
        let armor = {}

        if (category === 'weapon') {
          categoria = 'Arma'

          const cat = equipamiento.data.weapon_category
          const rang = equipamiento.data.weapon_range

          weapon = {
            category: cat==='Martial' ? 'Marcial' : 'Sencilla',
            range: rang==='Melee' ? "Cuerpo a cuerpo" : 'Distancia'
          }

          if (equipamiento?.data?.damage) {
            weapon.damage = {
              dice: equipamiento?.data?.damage?.damage_dice,
              type: equipamiento?.data?.damage?.damage_type?.index
            }
          }
          
        } else if (category === 'adventuring-gear') {
          if (equipamiento?.data?.gear_category?.name === 'Equipment Packs') {
            categoria = 'Paquete de equipo'
          } else if ((equipamiento?.data?.gear_category?.name ?? '') === 'Standard Gear') {
            categoria = 'Equipo estandar'
          } else if ((equipamiento?.data?.gear_category?.name ?? '') === 'Kits') {
            categoria = 'Utensilios'
          } else {
            categoria = equipamiento?.data?.gear_category?.name ?? ''
            
            /*console.log(actualEquip.category)
            console.log(equipamiento?.data?.gear_category?.name ?? '')
            console.log('__________________')*/
            
          }
        } else if (category === 'tools') {
          if (equipamiento?.data?.tool_category === 'Musical Instrument') {
            categoria = 'Instrumento musical'
          } else {
            categoria = equipamiento?.data?.tool_category ?? ''
          }
        } else if (category === 'armor') {
          categoria = 'Armadura'
          armor = {
            category: tipoArmadura[equipamiento?.data?.armor_category],
            class: equipamiento?.data?.armor_class,
            stealth_disadvantage: equipamiento?.data?.stealth_disadvantage
          }
        }

        return {
          index: equipamiento?.data?.index ?? '',
          name: actualEquip.name ?? '',
          //name: equipamiento?.data?.name ?? '',
          category: categoria,
          weapon,
          armor,
          cost: {
            quantity: equipamiento?.data?.cost?.quantity ?? 0,
            unit: equipamiento?.data?.cost?.unit ?? ''
          },
          content: equipamiento.data.contents.map(content => { return { item: content.item.index, quantity: content.quantity } }) ?? []
        }
      })

      equipamientos = equipamientosList
    }

    res.json(equipamientos);

  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las rasgos' });
  }
};