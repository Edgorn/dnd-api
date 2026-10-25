import CharacterService from "../../../domain/services/character.service";
import { CharacterEquipmentStateResponse, TypeEquipEquipment } from "../../../domain/types/character.types";

export default class EquipEquipment {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeEquipEquipment): Promise<CharacterEquipmentStateResponse> {
    return this.characterService.equipEquipment(data);
  }
}
