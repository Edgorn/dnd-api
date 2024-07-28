const ClaseService = require('../../../domain/services/clase.service');
const ClaseRepository = require('../../databases/mongoDb/repositories/clase.repository');

const claseService = new ClaseService(new ClaseRepository())

const getClases = async (req, res) => {
  const token = true

  try {
    if (token) {
      const { success, data, message } = await claseService.obtenerTodasLasClases()

      if (success) {
        res.status(200).json(data);
      } else {
        res.status(404).json({ error: message });
      }
    } else {
      res.status(401).json({ error: 'Token invalido' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};

module.exports = { getClases };