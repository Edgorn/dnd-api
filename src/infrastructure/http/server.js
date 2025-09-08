import usuarioRoutes from "./routes/usuario.routes";
import transfondoRoutes from "./routes/transfondo.routes";
import razaRoutes from "./routes/raza.routes";
import claseRoutes from "./routes/clase.routes";
import personajeRoutes from "./routes/personaje.routes";
import equipamientoRoutes from "./routes/equipamiento.routes";

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('../databases/mongoDb/mongodb');

const campañaRoutes = require('./routes/campaña.routes');
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
app.use(claseRoutes);
app.use(personajeRoutes)
app.use(equipamientoRoutes);

app.use(campañaRoutes)
app.use(monstruosRoutes);
app.use(npcsRoutes);
app.use('*', defaultApi)

const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
};

module.exports = startServer;
