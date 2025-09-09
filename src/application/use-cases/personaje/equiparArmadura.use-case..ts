import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeEquiparArmadura } from "../../../domain/types/personajes.types";

export default class EquiparArmadura {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeEquiparArmadura): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeService.equiparArmadura(data)
  }
}
