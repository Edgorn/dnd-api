import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { idiomaController } from "../../dependencies";

const router = Router();

router.get('/idiomas', authMiddleware, idiomaController.obtenerIdiomasPorSistemas);
router.post('/idiomas', authMiddleware, idiomaController.create);
router.put('/idiomas', authMiddleware, idiomaController.update);

export default router;