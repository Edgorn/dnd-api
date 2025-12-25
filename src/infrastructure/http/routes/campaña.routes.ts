import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";
import { campañaController } from "../../dependencies";

const router = Router();

router.get('/campaign', authMiddleware, campañaController.getCampaigns);
router.post('/campaign', authMiddleware, campañaController.createCampaign);
router.get('/campaign/:id', authMiddleware, campañaController.getCampaign);
router.post('/campaign/:id/request-join', authMiddleware, campañaController.requestJoinCampaign);
router.delete('/campaign/:id/request-join/:userId', authMiddleware, campañaController.denyJoinRequest);
router.post('/campaign/:id/request-join/:userId/accept', authMiddleware, campañaController.acceptJoinRequest);
router.post('/campaign/:id/add-character', authMiddleware, campañaController.addCharacterToCampaign);

export default router;
