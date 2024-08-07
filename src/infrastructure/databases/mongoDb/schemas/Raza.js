const mongoose = require('mongoose');

const razaSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: String,
  img: String,
  speed: Number,
  size: String,
  subraces: [{
    index: String,
    name: String,
    img: String,
    desc: String,
    speed: Number,
    types: [{
      name: String,
      desc: String,
      img: String
    }],
    ability_bonuses: [{
      index: String,
      bonus: Number
    }],
    starting_proficiencies: [],
    traits: [String],
    options: [],
    spells: [String],
    resistances: [String]
  }],
  ability_bonuses: [{
    index: String,
    bonus: Number
  }],
  starting_proficiencies: [],
  languages: [String],
  traits: [String],
  options: [],
  spells: [String],
  resistances: [String]
}, { collection: 'Razas' });

module.exports = mongoose.model('Razas', razaSchema);