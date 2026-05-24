import { Response } from "express";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerTodasLasHabilidades from "../../../application/use-cases/habilidad/obtenerHabilidadesPorSIstemas.use-case";

export class HabilidadController {
  constructor(
    private readonly obtenerTodasLasHabilidades: ObtenerTodasLasHabilidades
  ) { }

  obtenerTodas = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.obtenerTodasLasHabilidades.execute()
      res.status(200).json(data);
    } catch (e) {
      console.error(e)
      res.status(500).json({ error: 'Error al recuperar las habilidades' });
    }
  }
}
