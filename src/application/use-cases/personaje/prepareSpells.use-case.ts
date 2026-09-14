import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypePrepareSpells } from "../../../domain/types/personajes.types";

export default class PrepareSpells {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypePrepareSpells): Promise<PersonajeApi> {
    return this.personajeService.prepareSpells(data);
  }
}
