import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import GetSystemsByUser from "../../../application/use-cases/system/getSystemsByUser.use-case";
import CreateSystem from "../../../application/use-cases/system/createSystem.use-case";
import UpdateSystem from "../../../application/use-cases/system/updateSystem.use-case";
import CascadeSoftDeleteSystem from "../../../application/use-cases/system/cascadeSoftDeleteSystem.use-case";
import CascadeRestoreSystem from "../../../application/use-cases/system/cascadeRestoreSystem.use-case";
import { AppError } from "../../../domain/errors/AppError";

export class SystemController {
  constructor(
    private readonly getSystemsByUser: GetSystemsByUser,
    private readonly createSystemUseCase: CreateSystem,
    private readonly updateSystemUseCase: UpdateSystem,
    private readonly cascadeSoftDeleteSystem: CascadeSoftDeleteSystem,
    private readonly cascadeRestoreSystem: CascadeRestoreSystem
  ) {}

  getSystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const systems = await this.getSystemsByUser.execute(userId);
      res.status(200).json(systems);
    } catch (e) {
      console.error("[SystemController.getSystems] Error fetching systems:", e);
      next(e);
    }
  };

  createSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createSystemUseCase.execute({
        ...req.body,
        publisher: userId
      });

      res.status(201).json(data);
    } catch (e) {
      console.error("[SystemController.createSystem] Error creating system:", e);
      next(e);
    }
  };

  updateSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      const data = await this.updateSystemUseCase.execute({
        ...req.body,
        id,
        userId
      });

      res.status(200).json(data);
    } catch (e: any) {
      console.error("[SystemController.updateSystem] Error updating system:", e);
      if (e.message === 'No tienes permisos de edición para este sistema' || e.message === 'Sistema no encontrado') {
        return next(new AppError(e.message, 403));
      }
      next(e);
    }
  };

  deleteSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      await this.cascadeSoftDeleteSystem.execute(id, userId);
      res.status(204).send();
    } catch (e: any) {
      console.error("[SystemController.deleteSystem] Error deleting system:", e);
      if (e.message === 'No tienes permisos para borrar este sistema' || e.message === 'Sistema no encontrado') {
        return next(new AppError(e.message, e.message === 'Sistema no encontrado' ? 404 : 403));
      }
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      await this.cascadeRestoreSystem.execute(id, userId);
      res.status(200).json({ message: 'Sistema restaurado con éxito' });
    } catch (e: any) {
      console.error("[SystemController.restore] Error restoring system:", e);
      if (e.message === 'No tienes permisos para restaurar este sistema' || e.message === 'Sistema no encontrado') {
        return next(new AppError(e.message, e.message === 'Sistema no encontrado' ? 404 : 403));
      }
      next(e);
    }
  };
}
