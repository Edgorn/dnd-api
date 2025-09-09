import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeBasico } from "../../../domain/types/personajes.types";

export default class ObtenerPersonajesPorUsuario {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(id: string): Promise<PersonajeBasico[]> {
    return this.personajeService.consultarPorUsuario(id)
  }
}
