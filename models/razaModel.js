const mongoose = require('mongoose');

const razaSchema = new mongoose.Schema({
  index: String,
  name: String,
  subraces: [{
    index: String,
    name: String
  }]
}, { collection: 'Razas' });

const Raza = mongoose.model('Razas', razaSchema);

module.exports = Raza;