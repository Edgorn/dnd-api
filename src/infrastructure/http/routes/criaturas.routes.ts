import { Router } from "express";
import monstruosController from '../controllers/criaturas.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/creatures', authMiddleware, monstruosController.getCreatures);
router.post('/creatures/types', authMiddleware, monstruosController.getCreaturesByTypes);

export default router;