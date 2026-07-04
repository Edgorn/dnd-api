import { Response, NextFunction } from 'express';
import ObtenerTodasLasRazas from '../../../application/use-cases/raza/obtenerTodasLasRazas.use-case';
import CrearRaza from '../../../application/use-cases/raza/crearRaza.use-case';
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest';
import ActualizarRaza from '../../../application/use-cases/raza/actualizarRaza.use-case';
import { NotFoundError } from '../../../domain/errors/AppError';

export class RazaController {
  constructor(
    private readonly obtenerTodasLasRazas: ObtenerTodasLasRazas,
    private readonly crearRaza: CrearRaza,
    private readonly actualizarRaza: ActualizarRaza
  ) { }

  getRazas = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { ruleset } = req.query;

    try {
      const parsedRuleset = Array.isArray(ruleset)
        ? String(ruleset[0])
        : (ruleset ? String(ruleset) : undefined);
      const data = await this.obtenerTodasLasRazas.execute(parsedRuleset as string)
      res.status(200).json(data);
    } catch (e) {
      next(e);
    }
  };

  createRaza = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.crearRaza.execute(req.body)
      res.status(201).json(data);
    } catch (e) {
      next(e);
    }
  };

  updateRaza = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.actualizarRaza.execute(req.body)
      if (data) {
        res.status(200).json(data);
      } else {
        throw new NotFoundError('No se encontro la raza');
      }
    } catch (e) {
      next(e);
    }
  };
}