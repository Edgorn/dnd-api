import usuarioRoutes from "./routes/usuario.routes";
import transfondoRoutes from "./routes/transfondo.routes";

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('../databases/mongoDb/mongodb');

const razaRoutes = require('./routes/raza.routes');
const personajeRoutes = require('./routes/personaje.routes');
const campañaRoutes = require('./routes/campaña.routes');
const claseRoutes = require('./routes/clase.routes');
const equipamientoRoutes = require('./routes/equipamiento.routes');
const monstruosRoutes = require('./routes/monstruos.routes');
const npcsRoutes = require('./routes/npcs.routes');
const defaultApi = require('../defaultApi/index');

const app = express();
app.use(cors());
app.use(bodyParser.json());

connectDB();

app.use(usuarioRoutes)
app.use(transfondoRoutes);

app.use(razaRoutes)
app.use(personajeRoutes)
app.use(campañaRoutes)
app.use(claseRoutes);
app.use(equipamientoRoutes);
app.use(monstruosRoutes);
app.use(npcsRoutes);
app.use('*', defaultApi)

const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
};

module.exports = startServer;
