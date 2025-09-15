import ObtenerTodasLasCriaturas from "../../../application/use-cases/criatura/obtenerTodasLasCriaturas.use-case";
import CriaturaService from "../../../domain/services/criatura.service";
import CriaturaRepository from "../../databases/mongoDb/repositories/criaturas.repository";
import { Request, Response } from "express";
import DañoRepository from "../../databases/mongoDb/repositories/daño.repository";
import EstadoRepository from "../../databases/mongoDb/repositories/estado.repository";

const criaturaRepository = new CriaturaRepository(
  new DañoRepository(),
  new EstadoRepository()
)

const criaturaService = new CriaturaService(criaturaRepository)
const obtenerTodasLasCriaturas = new ObtenerTodasLasCriaturas(criaturaService)

const getCreatures = async (req: Request, res: Response) => {
  try {
    const data = await obtenerTodasLasCriaturas.execute()
    res.status(200).json(data);
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Error al crear campaña' });
  }
};

export default { getCreatures };