import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi } from "../../../domain/types/personajes.types";

export default class AprenderConjuros {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: { id: string; spells: string[]; type: string; }): Promise<PersonajeApi | null> {
    return this.personajeService.aprenderConjuros(data)
  }
}
