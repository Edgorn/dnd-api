import { Response } from 'express';

import ObtenerTodasLasRazas from '../../../application/use-cases/raza/obtenerTodasLasRazas.use-case';

import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest';

export class RazaController {
  constructor(
    private readonly obtenerTodasLasRazas: ObtenerTodasLasRazas
  ) { }

  getRazas = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.obtenerTodasLasRazas.execute()
      res.status(200).json(data);

    } catch (e) {
      res.status(500).json({ error: 'Error al recuperar las razas' });
    }
  };
}