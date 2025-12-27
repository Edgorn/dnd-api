import { Response } from "express";

import ObtenerTodosLosTransfondos from "../../../application/use-cases/transfondo/obtenerTodosLosTransfondos.use-case";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";

export class TransfondoController {
  constructor(
    private readonly obtenerTodosLosTransfondos: ObtenerTodosLosTransfondos
  ) { }

  getTransfondos = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.obtenerTodosLosTransfondos.execute()
      res.status(200).json(data);
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error al recuperar los transfondos' });
    }
  }
}
