import { Router } from "express";

import { authMiddleware } from "../middlewares/auth.middleware";
import { habilidadController } from "../../dependencies";

const router = Router();

router.get('/skills', authMiddleware, habilidadController.obtenerTodas);

export default router;