const mongoose = require('mongoose');

const claseSchema = new mongoose.Schema({
  index: String,
  name: String,
  levels: [{
    level: Number,
    prof_bonus: Number
  }],
  saving_throws: [String]
}, { collection: 'Clases' });

const Clase = mongoose.model('Clases', claseSchema);

module.exports = Clase;