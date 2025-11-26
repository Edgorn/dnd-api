import { Router } from "express";
import usuarioController from '../controllers/usuario.controller';
import { validateSchema } from "../middlewares/validateSchema";
import { loginSchema } from "../schemas/login.schema";

const router = Router();

router.post('/login', validateSchema(loginSchema), usuarioController.login);

export default router;