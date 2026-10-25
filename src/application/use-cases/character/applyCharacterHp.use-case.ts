import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeApplyCharacterHp } from "../../../domain/types/character.types";

export default class ApplyCharacterHp {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeApplyCharacterHp): Promise<CharacterStatePatch> {
    return this.characterService.applyHp(data);
  }
}
