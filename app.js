const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const razaRoutes = require('./routes/razaRoutes');
const claseRoutes = require('./routes/claseRoutes');
const transfondoRoutes = require('./routes/transfondoRoutes');
const habilidadRoutes = require('./routes/habilidadRoutes');
const idiomaRoutes = require('./routes/idiomaRoutes');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use(razaRoutes);
app.use(claseRoutes);
app.use(transfondoRoutes);
app.use(habilidadRoutes);
app.use(idiomaRoutes);

app.use(async (req, res) => {
  if (req.originalUrl !== '/favicon.ico') {
    const apiUrl = 'https://www.dnd5eapi.co/api' + req.originalUrl;

    console.log(apiUrl)
  
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
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
