const mongoose = require('mongoose');
const { mongoURI } = require('../../config/config');

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI)
    console.log('Conexión a MongoDB exitosa');
  } catch (err) {
    console.error('Error al conectar a MongoDB', err);
    //  process.exit(1); // Detiene la aplicación si hay un error
  }
};

module.exports = connectDB;