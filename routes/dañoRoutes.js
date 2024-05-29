const express = require('express');
const router = express.Router();
const dañoController = require('../controllers/dañoController');

router.get('/danos', dañoController.getDaños);

module.exports = router;