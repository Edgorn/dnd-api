const mongoose = require('mongoose');

const tipoSchema = new mongoose.Schema({
  name: String,
  desc: String,
  img: String
});

const subrazaSchema = new mongoose.Schema({
  index: String,
  name: String,
  img: String,
  ability_bonuses: [],
  traits: [String],
  traits_data: {},
  options: [],
  resistances: [String],
  types: [tipoSchema],
  desc: String
});

const razaSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: String,
  img: String,
  speed: Number,
  size: String,
  ability_bonuses: [],
  languages: [String],
  traits: [String],
  options: [],
  subraces: [subrazaSchema]
}, { collection: 'Razas' });

module.exports = mongoose.model('Razas', razaSchema);