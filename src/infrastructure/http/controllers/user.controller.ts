import { Request, Response, NextFunction } from "express";
import LoginUseCase from "../../../application/use-cases/user/login.use-case";
import RefreshTokenUseCase from "../../../application/use-cases/user/refreshToken.use-case";
import LogoutUseCase from "../../../application/use-cases/user/logout.use-case";
import { AppError } from "../../../domain/errors/AppError";

export class UserController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase
  ) { }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { user, password } = req.body;

      const data = await this.loginUseCase.execute({ user, password });

      if (!data) {
        console.warn(`[AUTH] Intento de login fallido: ${user}`);
        throw new AppError("Usuario o contraseña incorrectos", 401);
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError("Refresh token no proporcionado", 400);
      }

      const data = await this.refreshTokenUseCase.execute(refreshToken);

      if (!data) {
        throw new AppError("Refresh token inválido o expirado", 401);
      }

      res.status(200).json(data);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        throw new AppError("Refresh token no proporcionado", 400);
      }

      await this.logoutUseCase.execute(refreshToken);

      res.status(200).json({ message: "Sesión cerrada correctamente" });
    } catch (error) {
      next(error);
    }
  };
}