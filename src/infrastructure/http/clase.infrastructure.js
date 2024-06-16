const express = require('express');
const router = express.Router();
const claseController = require('../../../controllers/claseController');

router.get('/clases', async (req, res) => {
  const token = true

  try {
    if (token) {
      const { success, data, message } = await claseController.getClases()

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
});

module.exports = router;