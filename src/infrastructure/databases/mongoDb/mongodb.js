const mongoose = require('mongoose');
const { mongoURI } = require('../../config/config');

const connectDB = async () => {
  try {
    // await mongoose.connect('mongodb://127.0.0.1:27017/DragonsDungeons');process.env.MONGODB_URI
    //await mongoose.connect('mongodb+srv://edgarmaronda:295In7c2sP1fvXRS@cluster0.qootaji.mongodb.net/DragonsDungeons')
    await mongoose.connect(mongoURI)
    console.log('Conexión a MongoDB exitosa');
  } catch (err) {
    console.error('Error al conectar a MongoDB', err);
    //  process.exit(1); // Detiene la aplicación si hay un error
  }
};

module.exports = connectDB;