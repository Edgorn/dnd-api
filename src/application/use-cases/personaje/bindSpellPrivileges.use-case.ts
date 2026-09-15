import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeBindSpellPrivileges } from "../../../domain/types/personajes.types";

export default class BindSpellPrivileges {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeBindSpellPrivileges): Promise<PersonajeApi> {
    return this.personajeService.bindSpellPrivileges(data);
  }
}
