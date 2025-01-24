const mongoose = require('mongoose');

const transfondoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  img: String,
  starting_proficiencies: [],
  options: [],
  starting_equipment: [],
  starting_equipment_options: [],
  personalized_equipment: [String],
  money: {
    quantity: Number,
    unit: String
  },
  options_name: {
    name: String,
    options: [String]
  },
  personality_traits: [String],
  ideals: [String],
  bonds: [String],
  flaws: [String],
  traits: [String]
}, { collection: 'Transfondos' });

module.exports = mongoose.model('Transfondos', transfondoSchema);