const mongoose = require('mongoose');

const rasgoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  sum_desc: Boolean,
  type: String
}, { collection: 'Rasgos' });

const Rasgo = mongoose.model(' ', rasgoSchema);

module.exports = Rasgo;