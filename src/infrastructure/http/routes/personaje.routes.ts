const express = require('express');
const router = express.Router();
import personajeController from '../controllers/personaje.controller';

router.post('/character', personajeController.createCharacter);
router.get('/characters', personajeController.getCharacters);

module.exports = router;