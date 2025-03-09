const mongoose = require('mongoose');

const disciplinasSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  spells: [String],
  level: Number
}, { collection: 'DisciplinasElementales' });

module.exports = mongoose.model('DisciplinasElementales', disciplinasSchema);