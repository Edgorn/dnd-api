import { Request, Response } from "express";

import HabilidadRepository from "../../databases/mongoDb/repositories/habilidad.repository";
import CompetenciaRepository from "../../databases/mongoDb/repositories/competencia.repository";
import IdiomaRepository from "../../databases/mongoDb/repositories/idioma.repository";
import EquipamientoRepository from "../../databases/mongoDb/repositories/equipamiento.repository";
import RasgoRepository from "../../databases/mongoDb/repositories/rasgo.repository";

import TransfondoRepository from "../../databases/mongoDb/repositories/transfondo.repository";
import TransfondoService from "../../../domain/services/transfondo.service";
import ObtenerTodosLosTransfondos from "../../../application/use-cases/transfondo/obtenerTodosLosTransfondos.use-case";

const competenciaRepository = new CompetenciaRepository()

const transfondoRepository = new TransfondoRepository(
  new HabilidadRepository(),
  competenciaRepository,
  new IdiomaRepository(),
  new EquipamientoRepository(),
  new RasgoRepository(undefined, competenciaRepository)
);

const transfondoService = new TransfondoService(transfondoRepository)
const obtenerTodosLosTransfondos = new ObtenerTodosLosTransfondos(transfondoService);

const getTransfondos = async (req: Request, res: Response) => {
  try {
    const data = await obtenerTodosLosTransfondos.execute()
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: 'Error al recuperar los transfondos' });
  }
};

export default { getTransfondos };
