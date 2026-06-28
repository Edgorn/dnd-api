import { Response, NextFunction } from "express"
import ObtenerRasgosPorSistemas from "../../../application/use-cases/rasgo/obtenerRasgosPorSistemas.use-case"
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import CrearRasgo from "../../../application/use-cases/rasgo/crearRasgo.use-case";
import ModificarRasgo from "../../../application/use-cases/rasgo/modificarRasgo.use-case";

export class RasgoController {
  constructor(
    private readonly obtenerRasgosPorSistemasUseCase: ObtenerRasgosPorSistemas,
    private readonly createRasgoUseCase: CrearRasgo,
    private readonly updateRasgoUseCase: ModificarRasgo
  ) { }

  obtenerRasgosPorSistemas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { ruleset } = req.query;
      const rasgos = await this.obtenerRasgosPorSistemasUseCase.execute(ruleset as string[])
      return res.status(200).json(rasgos)
    } catch (error) {
      next(error);
    }
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rasgo = await this.createRasgoUseCase.execute(req.body);
      return res.status(201).json(rasgo);
    } catch (error) {
      next(error);
    }
  }

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const rasgo = await this.updateRasgoUseCase.execute(req.body);
      return res.status(200).json(rasgo);
    } catch (error) {
      next(error);
    }
  }
}