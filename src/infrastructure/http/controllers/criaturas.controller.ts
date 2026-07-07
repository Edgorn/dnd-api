import ObtenerTodasLasCriaturas from "../../../application/use-cases/criatura/obtenerTodasLasCriaturas.use-case";
import CriaturaService from "../../../domain/services/criatura.service";
import CriaturaRepository from "../../databases/mongoDb/repositories/criaturas.repository";
import { Response, NextFunction } from "express";
import DañoRepository from "../../databases/mongoDb/repositories/daño.repository";
import EstadoRepository from "../../databases/mongoDb/repositories/estado.repository";
import LanguageRepository from "../../databases/mongoDb/repositories/language.repository";
import ConjuroRepository from "../../databases/mongoDb/repositories/conjuros.repository";
import { AuthenticatedRequest } from "../interfaces/AuthenticatedRequest";
import ObtenerCriaturasPorTipos from "../../../application/use-cases/criatura/obtenerCriaturasPorTipos.use-case";

const criaturaRepository = new CriaturaRepository(
  new DañoRepository(),
  new EstadoRepository(),
  new LanguageRepository(null as any),
  new ConjuroRepository()
)

const criaturaService = new CriaturaService(criaturaRepository)
const obtenerTodasLasCriaturas = new ObtenerTodasLasCriaturas(criaturaService)
const obtenerCriaturasPorTipos = new ObtenerCriaturasPorTipos(criaturaService)

const getCreatures = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await obtenerTodasLasCriaturas.execute()
    res.status(200).json(data);
  } catch (e) {
    next(e);
  }
};

const getCreaturesByTypes = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { types } = req.body

    const data = await obtenerCriaturasPorTipos.execute(types)
    res.status(200).json(data);
  } catch (e) {
    next(e);
  }
};

export default { getCreatures, getCreaturesByTypes };