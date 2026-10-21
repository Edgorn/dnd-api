import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeSetCharacterFormActive } from "../../../domain/types/personajes.types";

export default class DeactivateCharacterForm {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeSetCharacterFormActive): Promise<PersonajeApi> {
    return this.personajeService.deactivateForm(data);
  }
}
