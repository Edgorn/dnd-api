import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi } from "../../../domain/types/personajes.types";

export default class AñadirForma {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: { id: string; form: string }): Promise<PersonajeApi | null> {
    return this.personajeService.añadirForma(data)
  }
}
