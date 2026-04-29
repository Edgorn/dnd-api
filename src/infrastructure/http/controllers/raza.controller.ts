import { Response } from 'express';

import ObtenerTodasLasRazas from '../../../application/use-cases/raza/obtenerTodasLasRazas.use-case';
import CrearRaza from '../../../application/use-cases/raza/crearRaza.use-case';

import { AuthenticatedRequest } from '../interfaces/AuthenticatedRequest';

export class RazaController {
  constructor(
    private readonly obtenerTodasLasRazas: ObtenerTodasLasRazas,
    private readonly crearRaza: CrearRaza
  ) { }

  getRazas = async (req: AuthenticatedRequest, res: Response) => {
    const { ruleset } = req.query;

    try {
      const data = await this.obtenerTodasLasRazas.execute(ruleset as string)
      res.status(200).json(data);

    } catch (e) {
      res.status(500).json({ error: 'Error al recuperar las razas' });
    }
  };

  createRaza = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const data = await this.crearRaza.execute(req.body)

      res.status(201).json(data);
    } catch (e) {
      console.error("Error en createRaza:", e);
      res.status(500).json({ error: 'Error al crear la raza' });
    }
  };
}