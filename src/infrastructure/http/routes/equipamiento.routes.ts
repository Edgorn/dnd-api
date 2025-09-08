import { Router } from "express";

import equipamientoController from '../controllers/equipamiento.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/equipment/:type', authMiddleware, equipamientoController.getEquipamientos);

export default router;