const mongoose = require('mongoose');

const rasgoSchema = new mongoose.Schema({
  index: String,
  name: String,
  desc: [String],
  sum_desc: Boolean,
  type: String,
  discard: String,
  isMutable: Boolean
}, { collection: 'Rasgos' });

module.exports = mongoose.model(' ', rasgoSchema);;