import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import CreateAttribute from "../../../application/use-cases/attribute/createAttribute.use-case";
import UpdateAttribute from "../../../application/use-cases/attribute/updateAttribute.use-case";
import AddAttributeToSystem from "../../../application/use-cases/attribute/addAttributeToSystem.use-case";
import RemoveAttributeFromSystem from "../../../application/use-cases/attribute/removeAttributeFromSystem.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

export class AttributeController {
  constructor(
    private readonly createAttributeUseCase: CreateAttribute,
    private readonly updateAttributeUseCase: UpdateAttribute,
    private readonly addAttributeToSystemUseCase: AddAttributeToSystem,
    private readonly removeAttributeFromSystemUseCase: RemoveAttributeFromSystem
  ) {}

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.createAttributeUseCase.execute(req.body);
      return res.status(201).json(data);
    } catch (e) {
      console.error("[AttributeController.create] Error:", e);
      next(e);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      if (!id) {
        throw new ValidationError("Attribute ID is required");
      }

      const data = await this.updateAttributeUseCase.execute({
        id,
        ...req.body
      });

      return res.status(200).json(data);
    } catch (e) {
      console.error("[AttributeController.update] Error:", e);
      next(e);
    }
  };

  addSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { systemId } = req.body;

      if (!id) {
        throw new ValidationError("Attribute ID is required");
      }

      const data = await this.addAttributeToSystemUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[AttributeController.addSystem] Error:", e);
      next(e);
    }
  };

  removeSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { id, systemId } = req.params;

      if (!id || !systemId) {
        throw new ValidationError("Attribute ID and system ID are required");
      }

      const data = await this.removeAttributeFromSystemUseCase.execute(id, systemId);
      return res.status(200).json(data);
    } catch (e) {
      console.error("[AttributeController.removeSystem] Error:", e);
      next(e);
    }
  };
}
