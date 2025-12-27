import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { razaController } from "../../dependencies";

const router = Router();

router.get('/razas', authMiddleware, razaController.getRazas);

export default router;