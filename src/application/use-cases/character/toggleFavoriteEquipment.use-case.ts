import CharacterService from "../../../domain/services/character.service";
import { ToggleFavoriteEquipmentResponse, TypeToggleFavoriteEquipment } from "../../../domain/types/character.types";

export default class ToggleFavoriteEquipment {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    return this.characterService.toggleFavoriteEquipment(data);
  }
}
