const mongoose = require('mongoose');

const conjuroSchema = new mongoose.Schema({
  index: String,
  name: String,
  level: Number,
  classes: [String]
}, { collection: 'Conjuros' });

module.exports = mongoose.model('Conjuros', conjuroSchema);