import { Router } from "express";
import { razaController, authMiddleware } from "../../dependencies";

const router = Router();

router.get('/razas', authMiddleware, razaController.getRazas);
router.post('/razas', authMiddleware, razaController.createRaza);
router.put('/razas', authMiddleware, razaController.updateRaza);
   
export default router;