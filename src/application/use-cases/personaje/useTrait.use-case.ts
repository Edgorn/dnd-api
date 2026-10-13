import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeUseTrait } from "../../../domain/types/personajes.types";

export default class UseTrait {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeUseTrait): Promise<PersonajeApi> {
    return this.personajeService.useTrait(data);
  }
}
