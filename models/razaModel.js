const mongoose = require('mongoose');

const razaSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: String,
  speed: Number,
  subraces: [{
    index: String,
    name: String,
    ability_bonuses: [{
      index: String,
      bonus: Number
    }],
    speed: Number,
    traits: [String]
  }],
  ability_bonuses: [{
    index: String,
    bonus: Number
  }],
  languages: [String],
  traits: [String]
}, { collection: 'Razas' });

const Raza = mongoose.model('Razas', razaSchema);

module.exports = Raza;