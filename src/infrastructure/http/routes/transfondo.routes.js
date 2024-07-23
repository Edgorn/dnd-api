const express = require('express');
const router = express.Router();
const transfondoController = require('../controllers/transfondo.controller');

router.get('/transfondos', transfondoController.getTransfondos);

module.exports = router;