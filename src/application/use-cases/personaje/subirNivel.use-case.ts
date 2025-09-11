import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico, TypeSubirNivel } from "../../../domain/types/personajes.types";

export default class SubirNivel {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeSubirNivel): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeService.subirNivel(data)
  }
}
