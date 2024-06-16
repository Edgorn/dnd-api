const express = require('express');
const cors = require('cors');
const connectDB = require('./src/infrastructure/databases/mongoDb/mongodb');
const razaRoutes = require('./src/infrastructure/http/raza.infrastructure');
const claseRoutes = require('./src/infrastructure/http/clase.infrastructure');
const defaultApi = require('./src/infrastructure/defaultApi/index');

const transfondoRoutes = require('./routes/transfondoRoutes');
const habilidadRoutes = require('./routes/habilidadRoutes');
const idiomaRoutes = require('./routes/idiomaRoutes');
const competenciaRoutes = require('./routes/competenciaRoutes');
const rasgoRoutes = require('./routes/rasgoRoutes');
const fichaRoutes = require('./routes/fichaRoutes');
const conjuroRoutes = require('./routes/conjuroRoutes');
const dañoRoutes = require('./routes/dañoRoutes');
const equipamientoRoutes = require('./routes/equipamientoRoutes');

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use(razaRoutes);
app.use(claseRoutes);
app.use(transfondoRoutes);
app.use(habilidadRoutes);
app.use(idiomaRoutes);
app.use(competenciaRoutes);
app.use(rasgoRoutes);
app.use(fichaRoutes);
app.use(conjuroRoutes);
app.use(dañoRoutes);
app.use(equipamientoRoutes);
app.use('*', defaultApi)

/*
app.use(async (req, res) => {
  if (req.originalUrl !== '/favicon.ico') {
    const apiUrl = 'https://www.dnd5eapi.co/api' + req.originalUrl;

    try {
      const { status, data } = await axios({
        method: req.method,
        url: apiUrl,
        data: req.body,
        headers: { 'Content-Type': 'application/json' } 
      });
     
      res.status(status).json(data);
    } catch (error) {
      res.status(500).json({ error: "Error al procesar la consulta externa" });
    }
  }
});
*/
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
