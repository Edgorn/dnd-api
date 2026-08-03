import { Router } from "express";
import spellRoutes from "./spell.routes";
import { spellController, authMiddleware } from "../../dependencies";

const router = Router();

// Backward compatibility legacy routes
router.get('/conjuros/nivel/:nivel', authMiddleware, spellController.getConjurosPorNivel);
router.get('/conjuros/rituales', authMiddleware, spellController.getConjurosRituales);

// Re-export full spell routes
router.use(spellRoutes);

export default router;