//const transfondoController = require('../../../../controllers/transfondoController');

const getTransfondos = async (req, res) => {
  const token = true

  try {
    if (token) {
      const success = false
      const message = "En proceso"
      const data = {}
      //const { success, data, message } = await transfondoController.getTransfondos()

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

module.exports = { getTransfondos };
