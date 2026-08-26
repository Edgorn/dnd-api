import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateEquipment from "../../../application/use-cases/equipment/createEquipment.use-case";
import UpdateEquipment from "../../../application/use-cases/equipment/updateEquipment.use-case";
import GetEquipmentById from "../../../application/use-cases/equipment/getEquipmentById.use-case";
import GetEquipmentsBySystems from "../../../application/use-cases/equipment/getEquipmentsBySystems.use-case";
import SoftDeleteEquipment from "../../../application/use-cases/equipment/softDeleteEquipment.use-case";
import RestoreEquipment from "../../../application/use-cases/equipment/restoreEquipment.use-case";
import GetEquipmentsByTypes from "../../../application/use-cases/equipment/getEquipmentsByTypes.use-case";

export class EquipmentController {
  constructor(
    private readonly createEquipmentUseCase: CreateEquipment,
    private readonly updateEquipmentUseCase: UpdateEquipment,
    private readonly getEquipmentByIdUseCase: GetEquipmentById,
    private readonly getEquipmentsBySystemsUseCase: GetEquipmentsBySystems,
    private readonly softDeleteEquipmentUseCase: SoftDeleteEquipment,
    private readonly restoreEquipmentUseCase: RestoreEquipment,
    private readonly getEquipmentsByTypesUseCase: GetEquipmentsByTypes
  ) { }

  getBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getEquipmentsBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[EquipmentController.getBySystems] Error:", e);
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      if (!id) {
        throw new ValidationError("ID de equipamiento requerido");
      }

      const data = await this.getEquipmentByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[EquipmentController.getById] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createEquipmentUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[EquipmentController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      if (!id) {
        throw new ValidationError("ID de equipamiento requerido");
      }

      const data = await this.updateEquipmentUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[EquipmentController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      if (!id) {
        throw new ValidationError("ID de equipamiento requerido");
      }

      await this.softDeleteEquipmentUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[EquipmentController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

      if (!id) {
        throw new ValidationError("ID de equipamiento requerido");
      }

      await this.restoreEquipmentUseCase.execute(id, userId);
      return res.status(200).json({ message: "Equipamiento restaurado con éxito" });
    } catch (e) {
      console.error("[EquipmentController.restore] Error:", e);
      next(e);
    }
  };

  getByTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const types = req.body.types || (req.params.type ? [req.params.type] : []);
      const data = await this.getEquipmentsByTypesUseCase.execute(types);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[EquipmentController.getByTypes] Error:", e);
      next(e);
    }
  };
}
