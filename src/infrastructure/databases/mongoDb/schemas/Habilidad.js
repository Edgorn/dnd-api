const mongoose = require('mongoose');

const habilidadSchema = new mongoose.Schema({
  index: String,
  name: String
}, { collection: 'Habilidades' });

const Habilidad = mongoose.model('Habilidades', habilidadSchema);

module.exports = Habilidad;