import { Router } from "express";
import { idiomaController, authMiddleware } from "../../dependencies";

const router = Router();

router.get('/idiomas', authMiddleware, idiomaController.obtenerIdiomasPorSistemas);
router.post('/idiomas', authMiddleware, idiomaController.create);
router.put('/idiomas', authMiddleware, idiomaController.update);

export default router;