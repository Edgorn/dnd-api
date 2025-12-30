import { Response } from "express";

import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerEquipamientosPorTipo from "../../../application/use-cases/equipamiento/obtenerEquipamientosPorTipo.use-case";

export class EquipamientoController {
  constructor(
    private readonly obtenerEquipamientosPorTipo: ObtenerEquipamientosPorTipo
  ) { }

  getEquipamientos = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.params;
      const data = await this.obtenerEquipamientosPorTipo.execute(type)
      res.status(200).json(data);
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error al consultar equipamiento' });
    }
  }
}