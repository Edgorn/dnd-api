import NpcService from "../../domain/services/npc.service";

export default class ConsultarNpcs {
  private npcService: NpcService

  constructor(npcService: NpcService) {
    this.npcService = npcService;
  }

  async execute(): Promise<{success: boolean, data?: any[], message?: string}> {
    return await this.npcService.obtenerTodosLosNpcs()
  }
}
