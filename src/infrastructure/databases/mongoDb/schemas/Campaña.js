const mongoose = require('mongoose');

const campañaSchema = new mongoose.Schema({
  name: String,
  description: String,
  master: String,
  status: String,
  players_requesting: [String],
  players: [String],
  characters: [String],
  PNJs: [Number]
}, { collection: 'Campañas' });

module.exports = mongoose.model('Campañas', campañaSchema);