import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { equipamientoController } from "../../dependencies";

const router = Router();

router.get('/equipment/:type', authMiddleware, equipamientoController.getEquipamientos);

export default router; 