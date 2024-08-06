const express = require('express');
const router = express.Router();
import razaController from '../controllers/raza.controller';

router.get('/razas', razaController.getRazas);

module.exports = router;