const mongoose = require('mongoose');

const dañoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: String
}, { collection: 'Daños' });

const Daño = mongoose.model('Daños', dañoSchema);

module.exports = Daño;