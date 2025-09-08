import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi } from "../../../domain/types/personajes";

export default class obtenerPersonajePorId {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(idCharacter: string, user: string): Promise<PersonajeApi> {
    return this.personajeService.consultarPersonaje(idCharacter, user)
  }
}
