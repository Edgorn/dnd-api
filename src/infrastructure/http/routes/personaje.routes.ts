const express = require('express');
const router = express.Router();
import personajeController from '../controllers/personaje.controller';

router.post('/character', personajeController.createCharacter);

module.exports = router;