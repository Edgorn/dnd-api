import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerEquipamientosPorTipos from "../../../application/use-cases/equipamiento/obtenerEquipamientosPorTipos.use-case";

export class EquipamientoController {
  constructor(
    private readonly obtenerEquipamientosPorTipos: ObtenerEquipamientosPorTipos
  ) { }

  getEquipamientosPorTipo = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { type } = req.params;
      const data = await this.obtenerEquipamientosPorTipos.execute([type])
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  }
  
  getEquipamientosPorTipos = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { types } = req.body;
      const data = await this.obtenerEquipamientosPorTipos.execute(types)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  }
}