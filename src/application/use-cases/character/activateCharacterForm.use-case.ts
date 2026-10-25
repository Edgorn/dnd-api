import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeSetCharacterFormActive } from "../../../domain/types/character.types";

export default class ActivateCharacterForm {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch> {
    return this.characterService.activateForm(data);
  }
}
