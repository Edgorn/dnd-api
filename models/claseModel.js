const mongoose = require('mongoose');

const claseSchema = new mongoose.Schema({
  index: String,
  name: String
}, { collection: 'Clases' });

const Clase = mongoose.model('Clases', claseSchema);

module.exports = Clase;