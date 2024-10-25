const mongoose = require('mongoose');

const propiedadArmaSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String]
}, { collection: 'PropiedadesArmas' });

module.exports = mongoose.model('PropiedadesArmas', propiedadArmaSchema);;