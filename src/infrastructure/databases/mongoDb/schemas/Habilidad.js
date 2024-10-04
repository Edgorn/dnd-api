const mongoose = require('mongoose');

const habilidadSchema = new mongoose.Schema({
  index: String,
  name: String,
  ability_score: String
}, { collection: 'Habilidades' });

module.exports = mongoose.model('Habilidades', habilidadSchema);