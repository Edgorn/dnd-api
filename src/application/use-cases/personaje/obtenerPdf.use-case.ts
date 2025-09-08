import PersonajeService from "../../../domain/services/personaje.service";

export default class ObtenerPdf {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(idCharacter: string, user: string): Promise<any> {
    return this.personajeService.obtenerPdf(idCharacter, user)
  }
}