const express = require('express');
const router = express.Router();
const claseController = require('../controllers/claseController');

router.get('/clases', claseController.getClases);

router.get('/clases/:clase/nivel/:nivel', claseController.getClaseNivel);

module.exports = router;