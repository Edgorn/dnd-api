const mongoose = require('mongoose');

const transfondoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  img: String,
  starting_proficiencies: [],
  options: [],
  starting_equipment: []

}, { collection: 'Transfondos' });

module.exports = mongoose.model('Transfondos', transfondoSchema);