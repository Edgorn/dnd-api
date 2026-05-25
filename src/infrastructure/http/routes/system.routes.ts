import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { systemController } from "../../dependencies";

const router = Router();

router.get('/systems', authMiddleware, systemController.getSystems);
router.post('/systems', authMiddleware, systemController.createSystem);
router.put('/systems/:id', authMiddleware, systemController.updateSystem);

export default router;
