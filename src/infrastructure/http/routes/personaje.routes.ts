import { Router } from "express";
import personajeController from '../controllers/personaje.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/character', authMiddleware, personajeController.getCharacters);
router.post('/character', authMiddleware, personajeController.createCharacter);
router.get('/character/:id', authMiddleware, personajeController.getCharacter);
router.get('/character/:id/pdf', authMiddleware, personajeController.generarPdf);
router.post('/character/addEquipment', authMiddleware, personajeController.añadirEquipamiento);
router.post('/character/deleteEquipment', authMiddleware, personajeController.eliminarEquipamiento);
router.post('/character/equipArmor', authMiddleware, personajeController.equiparArmadura);
router.post('/character/updateMoney', authMiddleware, personajeController.modificarDinero);


router.post('/character/changeXp', personajeController.changeXp);
router.post('/character/levelUpData', personajeController.levelUpData);
router.post('/character/levelUp', personajeController.levelUp);

export default router;