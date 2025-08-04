import { Request, Response } from 'express';

import ObtenerTodasLasRazas from '../../../application/use-cases/raza/obtenerTodasLasRazas.use-case';
import RazaService from '../../../domain/services/raza.service';
import RazaRepository from '../../databases/mongoDb/repositories/raza.repository';
import IdiomaRepository from '../../databases/mongoDb/repositories/idioma.repository';
import ConjuroRepository from '../../databases/mongoDb/repositories/conjuros.repository';
import HabilidadRepository from '../../databases/mongoDb/repositories/habilidad.repository';
import CompetenciaRepository from '../../databases/mongoDb/repositories/competencia.repository';
import DoteRepository from '../../databases/mongoDb/repositories/dote.repository';
import RasgoRepository from '../../databases/mongoDb/repositories/rasgo.repository';

const competenciaRepository = new CompetenciaRepository()
const conjuroRepository = new ConjuroRepository()

const razaRepository = new RazaRepository(
  new IdiomaRepository,
  conjuroRepository,
  new HabilidadRepository,
  competenciaRepository,
  new DoteRepository,
  new RasgoRepository(undefined, competenciaRepository, conjuroRepository)
)

const razaService = new RazaService(razaRepository)
const obtenerTodasLasRazas = new ObtenerTodasLasRazas(razaService);

const getRazas = async (req: Request, res: Response) => {
  try {
    const data = await obtenerTodasLasRazas.execute()
    res.status(200).json(data);
    
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar las razas' });
  }
};

export default { getRazas };