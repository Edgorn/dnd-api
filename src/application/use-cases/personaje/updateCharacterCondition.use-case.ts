import PersonajeService from "../../../domain/services/personaje.service";
import { PersonajeApi, TypeUpdateCharacterCondition } from "../../../domain/types/personajes.types";

export default class UpdateCharacterCondition {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: TypeUpdateCharacterCondition): Promise<PersonajeApi> {
    return this.personajeService.updateCharacterCondition(data);
  }
}
