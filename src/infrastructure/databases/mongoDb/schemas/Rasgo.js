const mongoose = require('mongoose');

const rasgoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  discard: [String],
  type: String,
  spells: [],
  skills: [],
  proficiencies: [],
  hidden: Boolean
}, { collection: 'Rasgos' });

module.exports = mongoose.model('Rasgos', rasgoSchema);;