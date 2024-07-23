const express = require('express');
const router = express.Router();
const claseController = require('../controllers/clase.controller');

router.get('/clases', claseController.getClases);

module.exports = router;