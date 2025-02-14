const mongoose = require('mongoose');

const conjuroSchema = new mongoose.Schema({
  index: String,
  name: String,
  level: Number,
  classes: [String],
  school: String,
  casting_time: String,
  range: String,
  components: [String],
  duration: String,
  desc: [String],
  ritual: Boolean
}, { collection: 'Conjuros' });

module.exports = mongoose.model('Conjuros', conjuroSchema);