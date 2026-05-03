import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { rasgoController } from "../../dependencies";

const router = Router();

router.get('/traits', authMiddleware, rasgoController.obtenerRasgosPorSistemas);

export default router;