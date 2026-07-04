import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import IUserRepository from "../../../domain/repositories/IUserRepository";

export const createAuthorizeSystemMiddleware = (userRepository: IUserRepository) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as AuthenticatedRequest).user || (req as any).userId;
      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const systemId = req.params.systemId || req.params.id || req.body?.systemId || req.query?.systemId;

      if (!systemId || typeof systemId !== 'string') {
        return next();
      }

      const user = await userRepository.getUserById(userId);
      if (!user) {
        return res.status(401).json({ error: "Usuario no encontrado" });
      }

      const hasAccess = !user.accessibleSystems || 
                        user.accessibleSystems.length === 0 || 
                        user.accessibleSystems.includes(systemId);

      if (!hasAccess) {
        return res.status(403).json({ error: "No tienes permisos de acceso a este sistema" });
      }

      next();
    } catch (error) {
      console.error("Error en authorizeSystem middleware:", error);
      return res.status(500).json({ error: "Error interno verificando permisos del sistema" });
    }
  };
};
