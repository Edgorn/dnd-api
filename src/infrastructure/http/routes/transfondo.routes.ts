import { Router } from "express";
import { transfondoController, authMiddleware } from "../../dependencies";

const router = Router();

router.get('/transfondos', authMiddleware, transfondoController.getTransfondos);

export default router;