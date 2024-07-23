const mongoose = require('mongoose');

const dañoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: String
}, { collection: 'Daños' });

module.exports = mongoose.model('Daños', dañoSchema);