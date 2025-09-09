import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeAñadirEquipamiento } from "../../../domain/types/personajes.types";

export default class AñadirEquipo {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeAñadirEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeService.añadirEquipamiento(data)
  }
}
