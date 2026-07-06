import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ValidateTokenUseCase from "../../../application/use-cases/user/validateToken.use-case";

export const createAuthMiddleware = (validateTokenUseCase: ValidateTokenUseCase) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }

    try {
      const isValid = await validateTokenUseCase.execute(token);

      if (!isValid) {
        return res.status(401).json({ error: "Token inválido" });
      }

      (req as AuthenticatedRequest).user = isValid;
      next();
    } catch (error) {
      console.error("Error validando token:", error);
      return res.status(500).json({ error: "Error interno de autenticación" });
    }
  };
};