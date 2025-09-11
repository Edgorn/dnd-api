import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico } from "../../../domain/types/personajes.types";

export default class ModificarXp {
  constructor(private readonly personajeService: PersonajeService) { }

  execute({id, XP}: {id: string, XP: number}): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeService.cambiarXp({id, XP})
  }
}
