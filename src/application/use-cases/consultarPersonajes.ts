import PersonajeService from "../../domain/services/personaje.service";
import { PersonajeBasico } from "../../domain/types/personajes";

export default class ConsultarPersonajes {
  private personajeService: PersonajeService

  constructor(personajeService: PersonajeService) {
    this.personajeService = personajeService;
  }

  async execute(id: string): Promise<{success: boolean, data?: PersonajeBasico[], message?: string}> {
    return await this.personajeService.consultarPersonajes(id)
  }
}
