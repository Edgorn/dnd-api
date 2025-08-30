import { Request, Response, NextFunction } from "express";
import ValidarToken from "../../../application/use-cases/usuario/validarToken.use-case";
import UsuarioService from "../../../domain/services/usuario.service";
import UsuarioRepository from "../../databases/mongoDb/repositories/usuario.repository";

const usuarioService = new UsuarioService(new UsuarioRepository());
const validarToken = new ValidarToken(usuarioService);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  try {
    const isValid = await validarToken.execute(token);

    if (!isValid) {
      return res.status(401).json({ error: "Token inválido" });
    }

    (req as any).user = isValid;
    next();
  } catch (error) {
    console.error("Error validando token:", error);
    return res.status(500).json({ error: "Error interno de autenticación" });
  }
};