const mongoose = require('mongoose');

const personajeSchema = new mongoose.Schema({
  name: String,
  user: String,
  img: String,
  background: {},
  appearance: {},
  abilities: {},
  raceId: String,
  subraceId?: String,
  type?: String,
  campaign?: String,
  race: String,
  traits: [String],
  resistances: [String],
  speed: Number,
  size: String,
  languages: [String],
  skills: [String],
  proficiency_weapon: [String],
  proficiency_armor: [String],
  proficiencies: [String],
  spells: [String],
  classes: [{
    class: String,
    level: Number
  }],
  CA: Number,
  HPMax: Number,
  HPActual: Number,
  XP: Number
}, { collection: 'Personajes' });

module.exports = mongoose.model('Personajes', personajeSchema);