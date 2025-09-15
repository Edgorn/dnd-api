import { Router } from "express";
import npcsController from '../controllers/npcs.controller';
import { authMiddleware } from "../middlewares/auth.middleware";
 
const router = Router();

router.get('/npcs', authMiddleware, npcsController.getNpcs);

export default router;
