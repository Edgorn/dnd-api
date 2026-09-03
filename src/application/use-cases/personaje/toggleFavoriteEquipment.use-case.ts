import PersonajeService from "../../../domain/services/personaje.service";
import { ToggleFavoriteEquipmentResponse, TypeToggleFavoriteEquipment } from "../../../domain/types/personajes.types";

export default class ToggleFavoriteEquipment {
  constructor(private readonly personajeService: PersonajeService) { }

  execute(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    return this.personajeService.toggleFavoriteEquipment(data);
  }
}
