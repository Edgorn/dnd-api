import PersonajeService from "../../domain/services/personaje.service";

export default class ConsultarPersonaje {
  private personajeService: PersonajeService

  constructor(personajeService: PersonajeService) {
    this.personajeService = personajeService;
  }

  async execute(idUser: any, idCharacter: string): Promise<any> {
    return await this.personajeService.consultarPersonaje(idUser, idCharacter)
  }
}
