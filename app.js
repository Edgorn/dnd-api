const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/razas', async (req, res) => {
  const requestOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const response = await axios.get("https://www.dnd5eapi.co/api/races", requestOptions)
  const razas = await Promise.all(response.data.results.map(async raza => await axios.get("https://www.dnd5eapi.co" + raza.url, requestOptions)))

  // console.log(razas.map(r => r.data))

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
