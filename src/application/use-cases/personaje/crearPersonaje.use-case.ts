import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeBasico, TypeCrearPersonaje } from "../../../domain/types/personajes";

export default class CrearPersonaje {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    return this.personajeService.crear(data)
  }
}
