import PersonajeService from "../../domain/services/personaje.service";

export default class UpdateMoney {
  private personajeService: PersonajeService

  constructor(personajeService: PersonajeService) {
    this.personajeService = personajeService;
  }

  async execute(id: string, money: number): Promise<{success: boolean, message?: string}> {
    return await this.personajeService.updateMoney(id, money)
  }
}
