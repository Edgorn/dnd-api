const mongoose = require('mongoose');

const idiomaSchema = new mongoose.Schema({
  index: String,
  name: String,
  type: String,
  typical_speakers: [String],
  script: String
}, { collection: 'Idiomas' });

const Idioma = mongoose.model('Idiomas', idiomaSchema);

module.exports = Idioma;