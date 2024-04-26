const mongoose = require('mongoose');

const razaSchema = new mongoose.Schema({
  index: String,
  name: String,
  subraces: [{
    index: String,
    name: String,
    ability_bonuses: [{
      index: String,
      bonus: Number
    }]
  }],
  ability_bonuses: [{
    index: String,
    bonus: Number
  }]
}, { collection: 'Razas' });

const Raza = mongoose.model('Razas', razaSchema);

module.exports = Raza;