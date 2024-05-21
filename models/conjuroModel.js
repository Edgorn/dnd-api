const mongoose = require('mongoose');

const conjuroSchema = new mongoose.Schema({
  index: String,
  name: String,
  level: Number
}, { collection: 'Conjuros' });

const Conjuro = mongoose.model('Conjuros', conjuroSchema);

module.exports = Conjuro;