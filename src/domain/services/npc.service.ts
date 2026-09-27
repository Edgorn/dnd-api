import INpcRepository from "../repositories/INpcRepository";
import { LegacyCreatureApi } from "../types/npc.types";

export default class NpcsService {
  constructor(private readonly npcRepository: INpcRepository) { }

  obtenerTodos(): Promise<LegacyCreatureApi[]> {
    return this.npcRepository.obtenerTodos();
  }
}
