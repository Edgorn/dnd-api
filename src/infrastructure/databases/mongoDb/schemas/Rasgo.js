const mongoose = require('mongoose');

const rasgoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  discard: [String],
  type: String,
  languages: [String],
  spells: [],
  skills: [],
  proficiencies: [],
  proficiencies_weapon: [],
  proficiencies_armor: [],
  speed: Number,
  hidden: Boolean,
  tables?: [{
    title: String,
    data: {
      titles: [String],
      rows: [[String]]
    }
  }]
}, { collection: 'Rasgos' });

module.exports = mongoose.model('Rasgos', rasgoSchema);;