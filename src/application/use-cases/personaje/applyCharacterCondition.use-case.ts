import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeApplyCharacterCondition } from "../../../domain/types/personajes.types";

export default class ApplyCharacterCondition {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeApplyCharacterCondition): Promise<PersonajeApi> {
    return this.personajeService.applyCharacterCondition(data);
  }
}
