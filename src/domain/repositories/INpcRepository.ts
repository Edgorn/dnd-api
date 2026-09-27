import { LegacyCreatureApi } from "../types/npc.types";

export default interface INpcRepository {
  obtenerTodos(): Promise<LegacyCreatureApi[]>
}
