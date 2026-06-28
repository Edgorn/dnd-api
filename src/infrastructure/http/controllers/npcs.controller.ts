import ObtenerTodosLosNpc from "../../../application/use-cases/npc/obtenerTodosLosNpc.use-case";
import NpcService from "../../../domain/services/npc.service";
import ConjuroRepository from "../../databases/mongoDb/repositories/conjuros.repository";
import DañoRepository from "../../databases/mongoDb/repositories/daño.repository";
import EstadoRepository from "../../databases/mongoDb/repositories/estado.repository";
import IdiomaRepository from "../../databases/mongoDb/repositories/idioma.repository";
import NpcRepository from "../../databases/mongoDb/repositories/npc.repository";
import { Request, Response, NextFunction } from "express";

const npcRepository = new NpcRepository(
  new DañoRepository(),
  new EstadoRepository(),
  new IdiomaRepository(),
  new ConjuroRepository()
)

const npcService = new NpcService(npcRepository)
const obtenerTodosLosNpcs = new ObtenerTodosLosNpc(npcService)

const getNpcs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await obtenerTodosLosNpcs.execute()
    res.status(200).json(data);
  } catch (e) {
    next(e);
  }
};

export default { getNpcs };