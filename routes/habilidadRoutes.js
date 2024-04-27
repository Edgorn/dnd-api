const express = require('express');
const router = express.Router();
const habilidadController = require('../controllers/habilidadController');

router.get('/habilidades', habilidadController.getHabilidades);

module.exports = router;