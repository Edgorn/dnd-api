const mongoose = require('mongoose');

const competenciaSchema = new mongoose.Schema({
  index: String,
  name: String,
  type: String,
  desc: [String]
}, { collection: 'Competencias' });

module.exports = mongoose.model('Competencias', competenciaSchema);