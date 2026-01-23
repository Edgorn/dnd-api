

import { Response } from 'express';
import ObtenerTodasLasClases from '../../../application/use-cases/clase/obtenerTodasLasClases.use-case';
import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest';

export class ClaseController {
  constructor(
    private readonly obtenerTodasLasClases: ObtenerTodasLasClases
  ) { }

  getClases = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.obtenerTodasLasClases.execute()
      res.status(200).json(data);
    } catch (e) {
      console.error(e) 
      res.status(500).json({ error: 'Error al recuperar las clases' });
    }
  }
}