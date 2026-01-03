import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { conjuroController } from "../../dependencies";

const router = Router();

router.get('/conjuros/nivel/:nivel', authMiddleware, conjuroController.getConjurosPorNivel);
router.get('/conjuros/rituales', authMiddleware, conjuroController.getConjurosRituales);

export default router;