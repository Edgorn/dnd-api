import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { equipamientoController } from "../../dependencies";

const router = Router();

router.get('/equipment/type/:type', authMiddleware, equipamientoController.getEquipamientosPorTipo);
router.post('/equipment/types', authMiddleware, equipamientoController.getEquipamientosPorTipos);

export default router; 