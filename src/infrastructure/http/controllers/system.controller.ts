import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import GetSystemsByUser from "../../../application/use-cases/system/getSystemsByUser.use-case";
import CrearSistema from "../../../application/use-cases/system/crearSistema.use-case";
import ModificarSistema from "../../../application/use-cases/system/modificarSistema.use-case";
import { ValidationError, AppError } from "../../../domain/errors/AppError";

import SoftDeleteSystem from "../../../application/use-cases/system/softDeleteSystem.use-case";
import RestoreSystem from "../../../application/use-cases/system/restoreSystem.use-case";

export class SystemController {
  constructor(
    private readonly getSystemsByUser: GetSystemsByUser,
    private readonly crearSistema: CrearSistema,
    private readonly modificarSistema: ModificarSistema,
    private readonly softDeleteSystem: SoftDeleteSystem,
    private readonly restoreSystem: RestoreSystem
  ) {}

  getSystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const systems = await this.getSystemsByUser.execute(userId);
      res.status(200).json(systems);
    } catch (e) {
      next(e);
    }
  };

  createSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { name, description, isOpen, isBase, parentId, globalModifierFormula, initiativeBonusFormula, defaultMinAttributeValue, defaultMaxAttributeValue, creationMinAttributeValue, creationMaxAttributeValue } = req.body;

      if (!name) {
        throw new ValidationError('El nombre del sistema es obligatorio');
      }

      const data = await this.crearSistema.execute({
        name,
        description: description || '',
        publisher: userId,
        isOpen: isOpen !== undefined ? isOpen : false,
        isBase: isBase !== undefined ? !!isBase : false,
        parentId,
        globalModifierFormula,
        initiativeBonusFormula,
        defaultMinAttributeValue,
        defaultMaxAttributeValue,
        creationMinAttributeValue,
        creationMaxAttributeValue
      });

      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  updateSystem = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      const { name, description, isOpen, isBase, parentId, globalModifierFormula, initiativeBonusFormula, defaultMinAttributeValue, defaultMaxAttributeValue, creationMinAttributeValue, creationMaxAttributeValue } = req.body;

      if (!id) {
        throw new ValidationError('Se requiere el ID del sistema');
      }

      const data = await this.modificarSistema.execute({
        id,
        userId,
        name,
        description,
        isOpen,
        isBase,
        parentId,
        globalModifierFormula,
        initiativeBonusFormula,
        defaultMinAttributeValue,
        defaultMaxAttributeValue,
        creationMinAttributeValue,
        creationMaxAttributeValue
      });

      res.status(200).json(data);
    } catch (e: any) {
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
      
      if (!id) {
        throw new ValidationError('Se requiere el ID del sistema');
      }

      await this.softDeleteSystem.execute(id, userId);
      res.status(204).send();
    } catch (e: any) {
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
      
      if (!id) {
        throw new ValidationError('Se requiere el ID del sistema');
      }

      await this.restoreSystem.execute(id, userId);
      res.status(200).json({ message: 'Sistema restaurado con éxito' });
    } catch (e: any) {
      if (e.message === 'No tienes permisos para restaurar este sistema' || e.message === 'Sistema no encontrado') {
        return next(new AppError(e.message, e.message === 'Sistema no encontrado' ? 404 : 403));
      }
      next(e);
    }
  };
}
