const mongoose = require('mongoose');

const idiomaSchema = new mongoose.Schema({
  index: String,
  name: String,
  type: String,
  typical_speakers: [String],
  script: String
}, { collection: 'Idiomas' });

module.exports = mongoose.model('Idiomas', idiomaSchema);