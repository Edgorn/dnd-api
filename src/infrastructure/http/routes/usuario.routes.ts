import express from "express";
import usuarioController from '../controllers/usuario.controller';
import { validateFields } from "../middlewares/validateFields";

const router = express.Router();

router.post('/login', validateFields(["user", "password"]), usuarioController.login);

export default router;