import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { equipamientoController } from "../../dependencies";

const router = Router();

router.get('/equipment/:type/:id', authMiddleware, equipamientoController.getEquipamientosPorTipo);
router.post('/equipment/:types', authMiddleware, equipamientoController.getEquipamientosPorTipos);

export default router; 