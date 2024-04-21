const express = require('express');
const router = express.Router();
const razaController = require('../controllers/razaController');

router.get('/razas', razaController.getRazas);

module.exports = router;