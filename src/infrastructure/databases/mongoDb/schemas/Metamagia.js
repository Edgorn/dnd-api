const mongoose = require('mongoose');

const metamagiaSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String]
}, { collection: 'Metamagia' });

module.exports = mongoose.model('Metamagia', metamagiaSchema);