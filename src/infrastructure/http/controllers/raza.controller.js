const RazaService = require('../../../domain/services/raza.service');
const RazaRepository = require('../../databases/mongoDb/repositories/raza.repository');

const razaService = new RazaService(new RazaRepository())

const getRazas = async (req, res) => {
  const token = true

  try {
    if (token) {
      const { success, data, message } = await razaService.obtenerTodasLasRazas()

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar las razas' });
  }
};

module.exports = { getRazas };