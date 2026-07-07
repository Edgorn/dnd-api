import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import { ValidationError } from "../../../domain/errors/AppError";
import CreateAttribute from "../../../application/use-cases/attribute/createAttribute.use-case";
import UpdateAttribute from "../../../application/use-cases/attribute/updateAttribute.use-case";
import SoftDeleteAttribute from "../../../application/use-cases/attribute/softDeleteAttribute.use-case";
import RestoreAttribute from "../../../application/use-cases/attribute/restoreAttribute.use-case";
import { AppError } from "../../../domain/errors/AppError";

export class AttributeController {
  constructor(
    private readonly createAttributeUseCase: CreateAttribute,
    private readonly updateAttributeUseCase: UpdateAttribute,
    private readonly softDeleteAttributeUseCase: SoftDeleteAttribute,
    private readonly restoreAttributeUseCase: RestoreAttribute
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

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      
      if (!id) {
        throw new ValidationError("Attribute ID is required");
      }

      await this.softDeleteAttributeUseCase.execute(id, userId);
      return res.status(204).send();
    } catch (e: any) {
      if (e.message === 'No tienes permisos para borrar este atributo' || e.message === 'Sistema asociado no encontrado' || e.message === 'Atributo no encontrado') {
        return next(new AppError(e.message, e.message.includes('encontrado') ? 404 : 403));
      }
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
    } catch (e: any) {
      if (e.message === 'No tienes permisos para restaurar este atributo' || e.message === 'Sistema asociado no encontrado' || e.message === 'Atributo no encontrado') {
        return next(new AppError(e.message, e.message.includes('encontrado') ? 404 : 403));
      }
      console.error("[AttributeController.restore] Error:", e);
      next(e);
    }
  };
}
