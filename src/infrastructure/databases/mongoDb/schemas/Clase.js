const mongoose = require('mongoose');

const claseSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: String,
  hit_die: Number,
  img: String,
  starting_proficiencies: [],
  levels: [{
    level: Number,
    prof_bonus: Number,
    traits: [String],
    spellcasting: {},
    subclasses_options: [],
    subclasses: {},
    terrain_options: {},
    enemy_options: {},
    traits_options: {},
    traits_data: {},
    ability_score: Boolean,
    invocations: Number,
    invocations_change: Number
  }],
  saving_throws: [String],
  options: [],
  starting_equipment: [
    {
      index: String,
      quantity: Number
    }
  ],
  starting_equipment_options: [],
  money: {},
  spellcasting: String
}, { collection: 'Clases' });

module.exports = mongoose.model('Clases', claseSchema);