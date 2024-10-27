import PersonajeService from "../../domain/services/personaje.service";

export default class SubirNivel {
  private personajeService: PersonajeService

  constructor(personajeService: PersonajeService) {
    this.personajeService = personajeService;
  }

  async execute(data: any): Promise<any> {
    return await this.personajeService.subirNivel(data)
  }
}