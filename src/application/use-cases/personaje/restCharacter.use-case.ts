import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeRestCharacter } from "../../../domain/types/personajes.types";

export default class RestCharacter {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeRestCharacter): Promise<PersonajeApi> {
    return this.personajeService.restCharacter(data);
  }
}
