import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeApplyCharacterHp } from "../../../domain/types/personajes.types";

export default class ApplyCharacterHp {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeApplyCharacterHp): Promise<PersonajeApi> {
    return this.personajeService.applyHp(data);
  }
}
