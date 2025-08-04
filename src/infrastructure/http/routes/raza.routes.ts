import { Router } from "express";
import razaController from '../controllers/raza.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/razas', authMiddleware, razaController.getRazas);

export default router;