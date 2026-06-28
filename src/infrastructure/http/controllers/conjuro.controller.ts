import { Response, NextFunction } from "express";
import ObtenerConjurosPorNivel from "../../../application/use-cases/conjuro/obtenerConjurosPorNivel.use-case";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerConjurosRituales from "../../../application/use-cases/conjuro/obtenerConjurosRituales.use-case";

export class ConjuroController {
  constructor(
    private readonly obtenerConjurosPorNivel: ObtenerConjurosPorNivel,
    private readonly obtenerConjurosRituales: ObtenerConjurosRituales
  ) { }

  getConjurosPorNivel = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const { nivel } = req.params;
      const data = await this.obtenerConjurosPorNivel.execute(Number(nivel))
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  getConjurosRituales = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.obtenerConjurosRituales.execute()
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };
}