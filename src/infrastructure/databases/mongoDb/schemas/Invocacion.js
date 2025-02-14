const mongoose = require('mongoose');

const invocacionSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  spells: [String],
  skills: [String],
  requirements: {}
}, { collection: 'Invocaciones' });

module.exports = mongoose.model('Invocaciones', invocacionSchema);