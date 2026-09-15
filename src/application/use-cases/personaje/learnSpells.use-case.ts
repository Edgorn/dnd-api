import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeLearnSpells } from "../../../domain/types/personajes.types";

export default class LearnSpells {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeLearnSpells): Promise<PersonajeApi> {
    return this.personajeService.learnSpells(data);
  }
}
