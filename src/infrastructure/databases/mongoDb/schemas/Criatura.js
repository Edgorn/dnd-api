const mongoose = require('mongoose');

const criaturaSchema = new mongoose.Schema({
  index: String,
  name: String,
  type: String,
  subtype: String,
  alignment: String,
  size: String,
  armor_class: {},
  hit_points: Number,
  hit_dice: String,
  speed: {},
  abilities: {},
  skills: String,
  senses: {},
  languages: String,
  challenge_rating: String,
  xp: Number,
  damage_vulnerabilities: [],
  damage_immunities: [],
  damage_resistances: [],
  condition_immunities: [],
  special_abilities: [],
  actions: [],
  reactions: [] 
}, { collection: 'Criaturas' });

module.exports = mongoose.model('Criaturas', criaturaSchema);