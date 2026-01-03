import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico } from "../../../domain/types/personajes.types";

export default class VincularPacto {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: { equip: string, id: string }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    return this.personajeService.vincularPacto(data)
  }
}
