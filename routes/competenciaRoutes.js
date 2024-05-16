const express = require('express');
const router = express.Router();
const competenciaController = require('../controllers/competenciaController');

router.get('/competencias', competenciaController.getCompetencias);

module.exports = router;