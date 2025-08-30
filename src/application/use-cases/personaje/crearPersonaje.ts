import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeBasico, TypeCrearPersonaje } from "../../../domain/types/personajes";

export default class CrearPersonaje {
  private personajeService: PersonajeService

  constructor(personajeService: PersonajeService) {
    this.personajeService = personajeService;
  }

  async execute(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    return await this.personajeService.crear(data)
  }
}
