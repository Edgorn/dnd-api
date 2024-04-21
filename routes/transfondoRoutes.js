const express = require('express');
const router = express.Router();
const transfondoController = require('../controllers/transfondoController');

router.get('/transfondos', transfondoController.getTransfondos);

module.exports = router;