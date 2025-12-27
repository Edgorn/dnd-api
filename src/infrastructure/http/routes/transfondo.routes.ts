import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { transfondoController } from "../../dependencies";

const router = Router();

router.get('/transfondos', authMiddleware, transfondoController.getTransfondos);

export default router;