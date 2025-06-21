const mongoose = require('mongoose');

const estadoSchema = new mongoose.Schema({
  index: String,
  name: String
}, { collection: 'Estados' });

module.exports = mongoose.model('Estados', estadoSchema);