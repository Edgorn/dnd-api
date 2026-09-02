import ObtenerTodosLosNpc from "../../../application/use-cases/npc/obtenerTodosLosNpc.use-case";
import NpcService from "../../../domain/services/npc.service";
import SpellRepository from "../../databases/mongoDb/repositories/spell.repository";
import DamageRepository from "../../databases/mongoDb/repositories/damage.repository";
import EstadoRepository from "../../databases/mongoDb/repositories/estado.repository";
import LanguageRepository from "../../databases/mongoDb/repositories/language.repository";
import NpcRepository from "../../databases/mongoDb/repositories/npc.repository";
import { Request, Response, NextFunction } from "express";

const npcRepository = new NpcRepository(
  new DamageRepository(),
  new EstadoRepository(),
  new LanguageRepository(null as any),
  new SpellRepository(null as any)
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