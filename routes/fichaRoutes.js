const express = require('express');
const router = express.Router();
const { crearFicha } = require('../controllers/fichaController');

router.post('/crearFicha', crearFicha);

module.exports = router;