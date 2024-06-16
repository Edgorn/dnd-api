const mongoose = require('mongoose');

const transfondoSchema = new mongoose.Schema({
  index: String,
  name: String
}, { collection: 'Transfondos' });

const Transfondo = mongoose.model('Transfondos', transfondoSchema);

module.exports = Transfondo;