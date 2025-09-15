import INpcRepository from "../repositories/INpcRepository";
import { CriaturaApi } from "../types/criaturas.types";

export default class NpcsService {
  constructor(private readonly npcRepository: INpcRepository) { }

  obtenerTodos(): Promise<CriaturaApi[]> {
    return this.npcRepository.obtenerTodos();
  }
}
