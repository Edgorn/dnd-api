import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeApplyCharacterCondition } from "../../../domain/types/character.types";

export default class ApplyCharacterCondition {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeApplyCharacterCondition): Promise<CharacterStatePatch> {
    return this.characterService.applyCharacterCondition(data);
  }
}
