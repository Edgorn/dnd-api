import NpcService from "../../../domain/services/npc.service";
import { LegacyCreatureApi } from "../../../domain/types/npc.types";

export default class ObtenerTodosLosNpc {
  constructor(private readonly npcService: NpcService) { }

  execute(): Promise<LegacyCreatureApi[]> {
    return this.npcService.obtenerTodos()
  }
}
