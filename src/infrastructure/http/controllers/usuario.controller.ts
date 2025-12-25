import { Request, Response } from "express";
import Logear from "../../../application/use-cases/usuario/login.use-case";

export class UsuarioController {
  constructor(private readonly logearUseCase: Logear) { }

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { user, password } = req.body

      const data = await this.logearUseCase.execute({ user, password })

      if (!data) {
        console.warn(`[AUTH] Intento de login fallido: ${user}`);
        res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        return;
      }

      res.status(200).json(data);

    } catch (error) {
      console.error("[AUTH] Error crítico en login:", error)
      res.status(500).json({ error: 'Error interno al intentar iniciar sesión' });
    }
  };
}