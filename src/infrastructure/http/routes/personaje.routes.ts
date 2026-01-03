import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { personajeController } from "../../dependencies";

const router = Router();

router.get('/character', authMiddleware, personajeController.getCharacters);
router.post('/character', authMiddleware, personajeController.createCharacter);
router.get('/character/:id', authMiddleware, personajeController.getCharacter);
router.get('/character/:id/pdf', authMiddleware, personajeController.generarPdf);
router.post('/character/addEquipment', authMiddleware, personajeController.añadirEquipamiento);
router.post('/character/deleteEquipment', authMiddleware, personajeController.eliminarEquipamiento);
router.post('/character/equipArmor', authMiddleware, personajeController.equiparArmadura);
router.post('/character/updateMoney', authMiddleware, personajeController.modificarDinero);
router.post('/character/vincularPacto', authMiddleware, personajeController.vincularArmaPacto);
router.post('/character/changeXp', authMiddleware, personajeController.changeXp);
router.post('/character/levelUpData', authMiddleware, personajeController.levelUpData);
router.post('/character/levelUp', authMiddleware, personajeController.levelUp);
router.post('/character/learnSpells', authMiddleware, personajeController.aprenderListaConjuros);

export default router;