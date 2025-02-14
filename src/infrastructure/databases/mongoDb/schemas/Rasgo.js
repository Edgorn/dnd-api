const mongoose = require('mongoose');

const rasgoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  type: String,
  spells: [],
  skills: [],
  hidden: Boolean
}, { collection: 'Rasgos' });

module.exports = mongoose.model('Rasgos', rasgoSchema);;