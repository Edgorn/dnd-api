import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import GetSystemsByUser from "../../../application/use-cases/system/getSystemsByUser.use-case";
import GetSystemById from "../../../application/use-cases/system/getSystemById.use-case";
import CreateSystem from "../../../application/use-cases/system/createSystem.use-case";
import UpdateSystem from "../../../application/use-cases/system/updateSystem.use-case";
import CascadeSoftDeleteSystem from "../../../application/use-cases/system/cascadeSoftDeleteSystem.use-case";
import CascadeRestoreSystem from "../../../application/use-cases/system/cascadeRestoreSystem.use-case";
import { SystemKind } from "../../../domain/types/system.types";

export class SystemController {
  constructor(
    private readonly getSystemsByUser: GetSystemsByUser,
    private readonly getSystemByIdUseCase: GetSystemById,
    private readonly createSystemUseCase: CreateSystem,
    private readonly updateSystemUseCase: UpdateSystem,
    private readonly cascadeSoftDeleteSystem: CascadeSoftDeleteSystem,
    private readonly cascadeRestoreSystem: CascadeRestoreSystem
  ) {}

  getSystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const kind = typeof req.query.kind === "string" ? req.query.kind as SystemKind : undefined;
      const systems = await this.getSystemsByUser.execute(userId, kind);
      res.status(200).json(systems);
    } catch (e) {
      console.error("[SystemController.getSystems] Error fetching systems:", e);
      next(e);
    }
  };

  getSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      const system = await this.getSystemByIdUseCase.execute(id, userId);
      res.status(200).json(system);
    } catch (e) {
      console.error("[SystemController.getSystem] Error fetching system:", e);
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
    } catch (e) {
      console.error("[SystemController.updateSystem] Error updating system:", e);
      next(e);
    }
  };

  deleteSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      await this.cascadeSoftDeleteSystem.execute(id, userId);
      res.status(204).send();
    } catch (e) {
      console.error("[SystemController.deleteSystem] Error deleting system:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      const data = await this.cascadeRestoreSystem.execute(id, userId);
      res.status(200).json(data);
    } catch (e) {
      console.error("[SystemController.restore] Error restoring system:", e);
      next(e);
    }
  };
}
