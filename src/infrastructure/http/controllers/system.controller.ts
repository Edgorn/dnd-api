import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerSistemasPorUsuario from "../../../application/use-cases/system/obtenerSistemasPorUsuario.use-case";
import CrearSistema from "../../../application/use-cases/system/crearSistema.use-case";
import ModificarSistema from "../../../application/use-cases/system/modificarSistema.use-case";
import { ValidationError, AppError } from "../../../domain/errors/AppError";

export class SystemController {
  constructor(
    private readonly obtenerSistemasPorUsuario: ObtenerSistemasPorUsuario,
    private readonly crearSistema: CrearSistema,
    private readonly modificarSistema: ModificarSistema
  ) {}

  getSystems = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!;
      const data = await this.obtenerSistemasPorUsuario.execute(userId);
      res.status(200).json(data);
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
}
