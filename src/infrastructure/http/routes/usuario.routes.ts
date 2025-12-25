import { Router } from "express";
import { validateSchema } from "../middlewares/validateSchema";
import { loginSchema } from "../schemas/login.schema";
import { usuarioController } from "../../dependencies";

const router = Router();

router.post('/login', validateSchema(loginSchema), usuarioController.login);

export default router;