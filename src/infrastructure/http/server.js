const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('../databases/mongoDb/mongodb');
const usuarioRoutes = require('./routes/usuario.routes');
const razaRoutes = require('./routes/raza.routes');
const claseRoutes = require('./routes/clase.routes');
const transfondoRoutes = require('./routes/transfondo.routes');
const defaultApi = require('../defaultApi/index');

const app = express();
app.use(cors());
app.use(bodyParser.json());

connectDB();

app.use(usuarioRoutes)
app.use(razaRoutes);
app.use(claseRoutes);
app.use(transfondoRoutes);
app.use('*', defaultApi)

const startServer = (port) => {
  app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
  });
};

module.exports = startServer;
