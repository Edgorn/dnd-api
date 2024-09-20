const mongoose = require('mongoose');

const campañaSchema = new mongoose.Schema({
  name: String,
  description: String,
  master: Number,
  status: String,
  players: [Number],
  characters: [],
  PNJs: [Number]
}, { collection: 'Campañas' });

module.exports = mongoose.model('Campañas', campañaSchema);