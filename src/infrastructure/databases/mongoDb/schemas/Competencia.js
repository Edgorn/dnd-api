const mongoose = require('mongoose');

const competenciaSchema = new mongoose.Schema({
  index: String,
  name: String,
  type: String,
  desc: [String]
}, { collection: 'Competencias' });

const Competencia = mongoose.model('Competencias', competenciaSchema);

module.exports = Competencia;