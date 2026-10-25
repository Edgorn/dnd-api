import CharacterService from "../../../domain/services/character.service";
import { TypeDeleteEquipment, UpdateCharacterEquipmentResponse } from "../../../domain/types/character.types";

export default class DeleteEquipment {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.characterService.deleteEquipment(data);
  }
}
