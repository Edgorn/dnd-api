import usuarioRoutes from "./routes/usuario.routes";
import transfondoRoutes from "./routes/transfondo.routes";
import razaRoutes from "./routes/raza.routes";
import claseRoutes from "./routes/clase.routes";
import personajeRoutes from "./routes/personaje.routes";
import equipamientoRoutes from "./routes/equipamiento.routes";
import campañaRoutes from "./routes/campaña.routes";
import criaturasRoutes from "./routes/criaturas.routes";
import npcsRoutes from "./routes/npcs.routes";

const express = require('express');
const cors = require('cors');
const connectDB = require('../databases/mongoDb/mongodb');

const defaultApi = require('../defaultApi/index');

const app = express();
app.use(cors());

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));

connectDB();

app.use(usuarioRoutes)
app.use(transfondoRoutes);
app.use(razaRoutes)
app.use(claseRoutes);
app.use(personajeRoutes)
app.use(equipamientoRoutes);
app.use(campañaRoutes)
app.use(criaturasRoutes);
app.use(npcsRoutes);

app.use('*', defaultApi)

const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
};

module.exports = startServer;
