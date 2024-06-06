const express = require('express');
const router = express.Router();
const equipamientoController = require('../controllers/equipamientoController');

router.get('/allEquipamientos', equipamientoController.getAllEquipamientos);

module.exports = router;