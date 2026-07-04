import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ValidateTokenUseCase from "../../../application/use-cases/user/validateToken.use-case";
import UserService from "../../../domain/services/user.service";
import UserRepository from "../../databases/mongoDb/repositories/user.repository";

import { BcryptPasswordHasher } from "../../security/BcryptPasswordHasher";
import { JwtTokenService } from "../../security/JwtTokenService";

import RefreshTokenRepository from "../../databases/mongoDb/repositories/refreshToken.repository";

const userService = new UserService(
  new UserRepository(),
  new BcryptPasswordHasher(),
  new JwtTokenService(process.env.JWT_SECRET ?? ''),
  new RefreshTokenRepository()
);
const validateTokenUseCase = new ValidateTokenUseCase(userService);

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
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