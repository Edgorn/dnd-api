const Raza = require('../models/razaModel');
const axios = require('axios');

exports.getRazas = async (req, res) => {
  try {
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json'
      }
    };
  
    const response = await axios.get("https://www.dnd5eapi.co/api/races", requestOptions)
    const razasAux = await Promise.all(response.data.results.map(async raza => await axios.get("https://www.dnd5eapi.co" + raza.url, requestOptions)))
    const razasAux2 = await Promise.all(
      razasAux
        .map(r => r.data)
        .map(async r => {
          const subrazasAux = await Promise.all(
            r.subraces.map(async sr => {
              const subrace = await axios.get("https://www.dnd5eapi.co" + sr.url, requestOptions)

              return subrace.data
            })
          )

          return {
            ...r,
            subraces: subrazasAux
          }
        })
    )

    let razas = [];
    try {
      // Intenta recuperar datos de MongoDB
      razas = await Raza.find();
      console.log(razas)
    } catch (dbError) {
      // Maneja el error si MongoDB no está disponible
      console.error("MongoDB no está disponible, se procederá solo con datos de la API externa");
    }

    const razasData = consultarRazas(razas, razasAux2)

    res.json(razasData);

  } catch (error) {
    res.status(500).json({ error: 'Error al recuperar las razas' });
  }
};

const consultarRazas = (razasBbdd, razasApi) => {
  const razasAux = []

  razasApi.forEach(razaApi => {
    const razaAux = razasBbdd.find(raza => raza.index === razaApi.index)

    razasAux.push({
      index: razaApi.index,
      name: razaAux?.name ?? razaApi.name,
      subraces: consultarSubrazas(razaAux?.subraces ?? [], razaApi.subraces),
      ability_bonuses: razaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }})
    })
  })

  return razasAux
}

const consultarSubrazas = (subrazasBbdd, subrazasApi) => {
  const subrazasAux = []
  let subrazasBbddAux = subrazasBbdd

  subrazasApi.forEach(subrazaApi => {
    const subrazaAux = subrazasBbddAux.find(subraza => subraza.index === subrazaApi.index)
    subrazasBbddAux = subrazasBbddAux.filter(subraza => subraza.index !== subrazaApi.index)

    subrazasAux.push({
      index: subrazaApi.index,
      name: subrazaAux?.name ?? subrazaApi?.name,
      desc: subrazaApi.desc,
      ability_bonuses: subrazaApi.ability_bonuses.map(ab => { return { index: ab.ability_score.index, bonus: ab.bonus }})
    })
  })

  return subrazasAux.concat(subrazasBbddAux.map(subraza => { return { index: subraza.index, name: subraza.name }}))
}