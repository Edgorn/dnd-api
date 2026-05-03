import { Response } from "express"
import ObtenerRasgosPorSistemas from "../../../application/use-cases/rasgo/obtenerRasgosPorSistemas.use-case"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";

export class RasgoController {
  constructor(
    private readonly obtenerRasgosPorSistemasUseCase: ObtenerRasgosPorSistemas,
  ) { }

  obtenerRasgosPorSistemas = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ruleset } = req.query;
      const rasgos = await this.obtenerRasgosPorSistemasUseCase.execute(ruleset as string[])
      return res.status(200).json(rasgos)
    } catch (error: any) {
      console.error(error)
      return res.status(500).json({ message: error.message })
    }
  }
}