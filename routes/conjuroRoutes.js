const express = require('express');
const router = express.Router();
const conjuroController = require('../controllers/conjuroController');

router.get('/conjuros', conjuroController.getConjuros);

module.exports = router;