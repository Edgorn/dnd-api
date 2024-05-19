const express = require('express');
const router = express.Router();
const rasgoController = require('../controllers/rasgoController');

router.get('/rasgos', rasgoController.getRasgos);

module.exports = router;