import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { razaController } from "../../dependencies";

const router = Router();

router.get('/razas', authMiddleware, razaController.getRazas);
router.post('/razas', authMiddleware, razaController.createRaza);

export default router;