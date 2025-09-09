import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeEliminarEquipamiento } from "../../../domain/types/personajes.types";

export default class EliminarEquipo {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeEliminarEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeService.eliminarEquipamiento(data)
  }
}
