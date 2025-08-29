

import { Request, Response } from 'express';
import HabilidadRepository from '../../databases/mongoDb/repositories/habilidad.repository';
import CompetenciaRepository from '../../databases/mongoDb/repositories/competencia.repository';
import EquipamientoRepository from '../../databases/mongoDb/repositories/equipamiento.repository';
import RasgoRepository from '../../databases/mongoDb/repositories/rasgo.repository';

import ObtenerTodasLasClases from '../../../application/use-cases/clase/obtenerTodasLasClases.use-case';
import ClaseService from '../../../domain/services/clase.service';
import ClaseRepository from '../../databases/mongoDb/repositories/clase.repository';

const competenciaRepository = new CompetenciaRepository()
const rasgoRepository = new RasgoRepository(undefined, competenciaRepository)

const claseRepository = new ClaseRepository(
  new HabilidadRepository,
  competenciaRepository,
  new EquipamientoRepository,
  rasgoRepository
)
 
const claseService = new ClaseService(claseRepository)
const obtenerTodasLasClases = new ObtenerTodasLasClases(claseService);

const getClases = async (req: Request, res: Response) => {
  try {
    const data = await obtenerTodasLasClases.execute()
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al recuperar las clases' });
  }
};

export default { getClases };