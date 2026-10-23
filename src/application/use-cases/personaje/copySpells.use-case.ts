import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeCopySpells } from "../../../domain/types/personajes.types";

export default class CopySpells {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeCopySpells): Promise<PersonajeApi> {
    return this.personajeService.copySpells(data);
  }
}
