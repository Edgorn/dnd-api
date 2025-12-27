import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { claseController } from "../../dependencies";

const router = Router();

router.get('/clases', authMiddleware, claseController.getClases);

export default router;