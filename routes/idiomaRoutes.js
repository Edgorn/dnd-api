const express = require('express');
const router = express.Router();
const idiomaController = require('../controllers/idiomaController');

router.get('/idiomas', idiomaController.getIdiomas);

module.exports = router;