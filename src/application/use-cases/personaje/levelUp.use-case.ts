import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeLevelUp } from "../../../domain/types/personajes.types";

export default class LevelUp {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeLevelUp): Promise<{ completo: PersonajeApi; basico: PersonajeBasico }> {
    return this.personajeService.levelUp(data);
  }
}
