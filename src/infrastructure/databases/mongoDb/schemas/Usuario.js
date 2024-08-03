const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  index: Number,
  name: String,
  password: String

}, { collection: 'Usuarios' });

module.exports = mongoose.model('Usuarios', usuarioSchema);