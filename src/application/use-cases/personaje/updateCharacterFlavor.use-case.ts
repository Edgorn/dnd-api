import PersonajeService from "../../../domain/services/personaje.service";
import {
  InputUpdateCharacterFlavor,
  UpdateCharacterFlavorResponse,
} from "../../../domain/types/personajes.types";

export default class UpdateCharacterFlavor {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(data: InputUpdateCharacterFlavor): Promise<UpdateCharacterFlavorResponse> {
    return this.personajeService.updateFlavor(data);
  }
}
