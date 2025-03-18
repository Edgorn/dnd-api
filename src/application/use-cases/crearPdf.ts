import PersonajeService from "../../domain/services/personaje.service";

export default class CrearPdf {
  private personajeService: PersonajeService

  constructor(personajeService: PersonajeService) {
    this.personajeService = personajeService;
  }

  async execute(idUser: string, idCharacter: string): Promise<any> {
    return await this.personajeService.crearPdf(idUser, idCharacter)
  }
}