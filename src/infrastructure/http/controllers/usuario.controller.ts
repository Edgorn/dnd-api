import { Request, Response, NextFunction } from "express";
import Logear from "../../../application/use-cases/usuario/login.use-case";
import { AppError } from "../../../domain/errors/AppError";

export class UsuarioController {
  constructor(private readonly logearUseCase: Logear) { }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, password } = req.body

      const data = await this.logearUseCase.execute({ user, password })

      if (!data) {
        console.warn(`[AUTH] Intento de login fallido: ${user}`);
        throw new AppError("Usuario o contraseña incorrectos", 401);
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };
}