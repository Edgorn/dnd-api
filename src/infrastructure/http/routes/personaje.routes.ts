import { Router } from "express";
import personajeController from '../controllers/personaje.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/character', authMiddleware, personajeController.getCharacters);

/**
 * import { Router } from "express";
 import claseController from '../controllers/clase.controller';
 import { authMiddleware } from "../middlewares/auth.middleware";
 
 const router = Router();
 
 router.get('/clases', authMiddleware, claseController.getClases);
 
 export default router;
 */


router.post('/character', personajeController.createCharacter);
router.get('/character/:id', personajeController.getCharacter);
router.get('/character/:id/pdf', personajeController.generarPdf);
router.post('/character/changeXp', personajeController.changeXp);
router.post('/character/levelUpData', personajeController.levelUpData);
router.post('/character/levelUp', personajeController.levelUp);
router.post('/character/addEquipment', personajeController.añadirEquipamiento);
router.post('/character/deleteEquipment', personajeController.eliminarEquipamiento);
router.post('/character/updateMoney', personajeController.modificarDinero);
router.post('/character/equipArmor', personajeController.equiparArmadura);

export default router;