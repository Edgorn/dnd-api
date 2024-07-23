const mongoose = require('mongoose');

const habilidadSchema = new mongoose.Schema({
  index: String,
  name: String
}, { collection: 'Habilidades' });

module.exports = mongoose.model('Habilidades', habilidadSchema);