import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerSistemasPorUsuario from "../../../application/use-cases/system/obtenerSistemasPorUsuario.use-case";
import CrearSistema from "../../../application/use-cases/system/crearSistema.use-case";
import ModificarSistema from "../../../application/use-cases/system/modificarSistema.use-case";

export class SystemController {
  constructor(
    private readonly obtenerSistemasPorUsuario: ObtenerSistemasPorUsuario,
    private readonly crearSistema: CrearSistema,
    private readonly modificarSistema: ModificarSistema
  ) {}

  getSystems = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!;
      const data = await this.obtenerSistemasPorUsuario.execute(userId);
      res.status(200).json(data);
    } catch (e) {
      this.handleError(res, e, 'Error al consultar sistemas');
    }
  };

  createSystem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!;
      const { name, description, isOpen, globalModifierFormula, initiativeBonusFormula, defaultMinAttributeValue, defaultMaxAttributeValue, creationMinAttributeValue, creationMaxAttributeValue } = req.body;

      if (!name) {
        return res.status(400).json({ error: 'El nombre del sistema es obligatorio' });
      }

      const data = await this.crearSistema.execute({
        name,
        description: description || '',
        publisher: userId,
        isOpen: isOpen !== undefined ? isOpen : false,
        globalModifierFormula,
        initiativeBonusFormula,
        defaultMinAttributeValue,
        defaultMaxAttributeValue,
        creationMinAttributeValue,
        creationMaxAttributeValue
      });

      res.status(201).json(data);
    } catch (e) {
      this.handleError(res, e, 'Error al crear sistema');
    }
  };

  updateSystem = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user!;
      const { id } = req.params;
      const { name, description, isOpen, globalModifierFormula, initiativeBonusFormula, defaultMinAttributeValue, defaultMaxAttributeValue, creationMinAttributeValue, creationMaxAttributeValue } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Se requiere el ID del sistema' });
      }

      const data = await this.modificarSistema.execute({
        id,
        userId,
        name,
        description,
        isOpen,
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
        return res.status(403).json({ error: e.message });
      }
      this.handleError(res, e, 'Error al modificar sistema');
    }
  };

  private handleError(res: Response, e: any, message: string) {
    console.error(e);
    res.status(500).json({ error: message });
  }
}
