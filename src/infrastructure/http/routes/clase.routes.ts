import { Router } from "express";
import { claseController, authMiddleware } from "../../dependencies";

const router = Router();

router.get('/clases', authMiddleware, claseController.getClases);

export default router;