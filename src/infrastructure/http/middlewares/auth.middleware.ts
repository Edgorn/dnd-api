import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ValidateTokenUseCase from "../../../application/use-cases/user/validateToken.use-case";
import { AppError } from "../../../domain/errors/AppError";

export const createAuthMiddleware = (validateTokenUseCase: ValidateTokenUseCase) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return next(new AppError("Token no proporcionado", 401));
    }

    try {
      const isValid = await validateTokenUseCase.execute(token);

      if (!isValid) {
        return next(new AppError("Token inválido", 401));
      }

      (req as AuthenticatedRequest).user = isValid;
      next();
    } catch (error) {
      console.error("Error validando token:", error);
      return next(new AppError("Error interno de autenticación", 500));
    }
  };
};