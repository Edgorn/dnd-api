const express = require('express');
const router = express.Router();
import personajeController from '../controllers/personaje.controller';

router.post('/character', personajeController.createCharacter);
router.get('/character', personajeController.getCharacters);
router.get('/character/:id', personajeController.getCharacter);
router.get('/character/:id/pdf', personajeController.generarPdf);
router.post('/character/changeXp', personajeController.changeXp);
router.post('/character/levelUpData', personajeController.levelUpData);
router.post('/character/levelUp', personajeController.levelUp);
router.post('/character/addEquipment', personajeController.añadirEquipamiento);
router.post('/character/deleteEquipment', personajeController.eliminarEquipamiento);
router.post('/character/updateMoney', personajeController.modificarDinero);
router.post('/character/equipArmor', personajeController.equiparArmadura);

module.exports = router;