const express = require('express');
const router = express.Router();
import personajeController from '../controllers/personaje.controller';

router.post('/character', personajeController.createCharacter);
router.get('/character', personajeController.getCharacters);
router.get('/character/:id', personajeController.getCharacter);

module.exports = router;