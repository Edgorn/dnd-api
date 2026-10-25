import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeSetCharacterFormActive } from "../../../domain/types/character.types";

export default class DeactivateCharacterForm {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeSetCharacterFormActive): Promise<CharacterApi> {
    return this.characterService.deactivateForm(data);
  }
}
