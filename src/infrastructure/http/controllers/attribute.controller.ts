import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateAttribute from "../../../application/use-cases/attribute/createAttribute.use-case";
import UpdateAttribute from "../../../application/use-cases/attribute/updateAttribute.use-case";
import SoftDeleteAttribute from "../../../application/use-cases/attribute/softDeleteAttribute.use-case";
import RestoreAttribute from "../../../application/use-cases/attribute/restoreAttribute.use-case";
import GetAttributesBySystems from "../../../application/use-cases/attribute/getAttributesBySystems.use-case";

export class AttributeController {
  constructor(
    private readonly createAttributeUseCase: CreateAttribute,
    private readonly updateAttributeUseCase: UpdateAttribute,
    private readonly softDeleteAttributeUseCase: SoftDeleteAttribute,
    private readonly restoreAttributeUseCase: RestoreAttribute,
    private readonly getAttributesBySystemsUseCase: GetAttributesBySystems
  ) {}

  getAttributesBySystems = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      let rulesets: string[] | undefined;

      if (typeof ruleset === "string") {
        rulesets = [ruleset];
      } else if (Array.isArray(ruleset)) {
        rulesets = ruleset as string[];
      }

      const data = await this.getAttributesBySystemsUseCase.execute(rulesets);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[AttributeController.getAttributesBySystems] Error:", e);
      next(e);
    }
  };

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.createAttributeUseCase.execute(req.body, userId);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[AttributeController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Attribute ID is required");
      }

      const data = await this.updateAttributeUseCase.execute({
        id,
        ...req.body
      }, userId);

      return res.status(200).json(data);
    } catch (e) {
      console.error("[AttributeController.update] Error:", e);
      next(e);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Attribute ID is required");
      }

      await this.softDeleteAttributeUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e) {
      console.error("[AttributeController.delete] Error:", e);
      next(e);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Attribute ID is required");
      }

      await this.restoreAttributeUseCase.execute(id, userId);
      return res.status(200).json({ message: 'Atributo restaurado con éxito' });
    } catch (e) {
      console.error("[AttributeController.restore] Error:", e);
      next(e);
    }
  };
}
