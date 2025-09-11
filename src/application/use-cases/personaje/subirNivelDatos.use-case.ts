import PersonajeService from "../../../domain/services/personaje.service";
import { ClaseLevelUpCharacter } from "../../../domain/types/personajes.types";

export default class SubirNivelDatos {
  constructor(private readonly personajeService: PersonajeService) { }

  execute({ id, clase }: { id: string, clase: string }): Promise<ClaseLevelUpCharacter | null> {
    return this.personajeService.subirNivelDatos({ id, clase })
  }
}
