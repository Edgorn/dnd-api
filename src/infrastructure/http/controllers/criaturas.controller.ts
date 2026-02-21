import ObtenerTodasLasCriaturas from "../../../application/use-cases/criatura/obtenerTodasLasCriaturas.use-case";
import CriaturaService from "../../../domain/services/criatura.service";
import CriaturaRepository from "../../databases/mongoDb/repositories/criaturas.repository";
import { Response } from "express";
import DañoRepository from "../../databases/mongoDb/repositories/daño.repository";
import EstadoRepository from "../../databases/mongoDb/repositories/estado.repository";
import IdiomaRepository from "../../databases/mongoDb/repositories/idioma.repository";
import ConjuroRepository from "../../databases/mongoDb/repositories/conjuros.repository";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerCriaturasPorTipos from "../../../application/use-cases/criatura/obtenerCriaturasPorTipos.use-case";

const criaturaRepository = new CriaturaRepository(
  new DañoRepository(),
  new EstadoRepository(),
  new IdiomaRepository(),
  new ConjuroRepository()
)

const criaturaService = new CriaturaService(criaturaRepository)
const obtenerTodasLasCriaturas = new ObtenerTodasLasCriaturas(criaturaService)
const obtenerCriaturasPorTipos = new ObtenerCriaturasPorTipos(criaturaService)

const getCreatures = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = await obtenerTodasLasCriaturas.execute()
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al obtener criaturas' });
  }
};

const getCreaturesByTypes = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { types } = req.body

    const data = await obtenerCriaturasPorTipos.execute(types)
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al obtener criaturas' });
  }
};

export default { getCreatures, getCreaturesByTypes };