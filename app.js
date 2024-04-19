const express = require('express');
const axios = require('axios');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/dvd-5e')
  .then(() => console.log('Conexión a MongoDB exitosa'))
  .catch(err => console.error('Error al conectar a MongoDB', err));

const razaSchema = new mongoose.Schema({
  index: String,
  name: String
}, { collection: 'Raza' });

const Raza = mongoose.model('Raza', razaSchema);

app.get('/razas', async (req, res) => {

  let razas2 = await Raza.find();
  
  console.log(razas2)

  const requestOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = await axios.get("https://www.dnd5eapi.co/api/races", requestOptions)
  const razas = await Promise.all(response.data.results.map(async raza => await axios.get("https://www.dnd5eapi.co" + raza.url, requestOptions)))

  const razasData = razas.map(r => r.data).map(r => {
    return {
      index: r.index,
      name: r.name,
      subraces: r.subraces
    }
  })
  
  res.json(razasData);
});

app.use(async (req, res) => {
  const apiUrl = 'https://www.dnd5eapi.co/api' + req.originalUrl;

  try {
    const response = await axios({
      method: req.method,
      url: apiUrl,
      data: req.body,
      headers: { 'Content-Type': 'application/json' } 
    });

    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error al procesar la consulta externa" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
