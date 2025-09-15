import { Router } from "express";
import monstruosController from '../controllers/criaturas.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/creatures', authMiddleware, monstruosController.getCreatures);

export default router;