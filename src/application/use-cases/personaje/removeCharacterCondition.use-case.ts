import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeRemoveCharacterCondition } from "../../../domain/types/personajes.types";

export default class RemoveCharacterCondition {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeRemoveCharacterCondition): Promise<PersonajeApi> {
    return this.personajeService.removeCharacterCondition(data);
  }
}
