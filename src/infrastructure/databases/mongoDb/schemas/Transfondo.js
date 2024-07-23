const mongoose = require('mongoose');

const transfondoSchema = new mongoose.Schema({
  index: String,
  name: String,
  starting_proficiencies: [],
  options: []

}, { collection: 'Transfondos' });

module.exports = mongoose.model('Transfondos', transfondoSchema);