import { Router } from "express";
import { rasgoController, authMiddleware } from "../../dependencies";

const router = Router();

router.get('/traits', authMiddleware, rasgoController.obtenerRasgosPorSistemas);
router.post('/traits', authMiddleware, rasgoController.create);
router.put('/traits', authMiddleware, rasgoController.update);

export default router;