import CharacterService from "../../../domain/services/character.service";
import {
  InputUpdateCharacterFlavor,
  UpdateCharacterFlavorResponse,
} from "../../../domain/types/character.types";

export default class UpdateCharacterFlavor {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: InputUpdateCharacterFlavor): Promise<UpdateCharacterFlavorResponse> {
    return this.characterService.updateFlavor(data);
  }
}
