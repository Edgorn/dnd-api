import CharacterService from "../../../domain/services/character.service";
import { TypeUpdateEquipmentCustomization, UpdateCharacterEquipmentCustomizationResponse } from "../../../domain/types/character.types";

export default class UpdateEquipmentCustomization {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeUpdateEquipmentCustomization): Promise<UpdateCharacterEquipmentCustomizationResponse> {
    return this.characterService.updateEquipmentCustomization(data);
  }
}
