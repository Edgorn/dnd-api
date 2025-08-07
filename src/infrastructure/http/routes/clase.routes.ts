import { Router } from "express";
import claseController from '../controllers/clase.controller';
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/clases', authMiddleware, claseController.getClases);

export default router;