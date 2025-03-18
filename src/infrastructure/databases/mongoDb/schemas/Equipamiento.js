const mongoose = require('mongoose');

const equipamientoSchema = new mongoose.Schema({
  index: String,
  name: String,
  category: String,
  cost: {
    quantity: Number,
    unit: String
  },
  weapon: {
    category: String,
    range: String,
    damage: {},
    two_handed_damage: {},
    properties: [],
    range_throw: {},
    competency: [String]
  },
  armor: {},
  content: [{item: String, quantity: Number}]
}, { collection: 'Equipamientos' });

module.exports = mongoose.model('Equipamientos', equipamientoSchema);