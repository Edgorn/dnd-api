import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateProperty from "../../../application/use-cases/property/createProperty.use-case";
import UpdateProperty from "../../../application/use-cases/property/updateProperty.use-case";
import SoftDeleteProperty from "../../../application/use-cases/property/softDeleteProperty.use-case";
import RestoreProperty from "../../../application/use-cases/property/restoreProperty.use-case";
import GetPropertiesBySystems from "../../../application/use-cases/property/getPropertiesBySystems.use-case";
import GetPropertyById from "../../../application/use-cases/property/getPropertyById.use-case";

export class PropertyController {
  constructor(
    private readonly createPropertyUseCase: CreateProperty,
    private readonly updatePropertyUseCase: UpdateProperty,
    private readonly softDeletePropertyUseCase: SoftDeleteProperty,
    private readonly restorePropertyUseCase: RestoreProperty,
    private readonly getPropertiesBySystemsUseCase: GetPropertiesBySystems,
    private readonly getPropertyByIdUseCase: GetPropertyById
  ) {}

  getPropertiesBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getPropertiesBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[PropertyController.getPropertiesBySystems] Error:", e);
      next(e);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new ValidationError("Property ID is required");
      }
      const data = await this.getPropertyByIdUseCase.execute(id);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[PropertyController.getById] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createPropertyUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[PropertyController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = req.params.id as string;

      if (!id) {
        throw new ValidationError("Property ID is required");
      }

      const data = await this.updatePropertyUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[PropertyController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = req.params.id as string;

      if (!id) {
        throw new ValidationError("Property ID is required");
      }

      await this.softDeletePropertyUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[PropertyController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const id = req.params.id as string;

      if (!id) {
        throw new ValidationError("Property ID is required");
      }

      await this.restorePropertyUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Propiedad de arma restaurada con éxito' });
    } catch (e) {
      console.error("[PropertyController.restore] Error:", e);
      next(e);
    }
  };
}
