const mongoose = require('mongoose');

const usuarioSchema = new mongoose.Schema({
  index: Number,
  token: String,
  name: String,
  password: String

}, { collection: 'Usuarios' });

module.exports = mongoose.model('Usuarios', usuarioSchema);