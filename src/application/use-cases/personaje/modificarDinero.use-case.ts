import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, PersonajeBasico } from "../../../domain/types/personajes.types";

export default class ModificarDinero {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(id: string, money: number): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    return this.personajeService.modificarDinero(id, money)
  }
}
