import { Router } from "express";
import transfondoController from "../controllers/transfondo.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get('/transfondos', authMiddleware, transfondoController.getTransfondos);

export default router;