import NpcService from "../../../domain/services/npc.service";
import { CriaturaApi } from "../../../domain/types/criaturas.types";

export default class ObtenerTodosLosNpc {
  constructor(private readonly npcService: NpcService) { }

  execute(): Promise<CriaturaApi[]> {
    return this.npcService.obtenerTodos()
  }
}
