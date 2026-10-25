import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeApplyCharacterHp } from "../../../domain/types/character.types";

export default class ApplyCharacterHp {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeApplyCharacterHp): Promise<CharacterApi> {
    return this.characterService.applyHp(data);
  }
}
