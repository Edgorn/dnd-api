import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeApplyCharacterCondition } from "../../../domain/types/character.types";

export default class ApplyCharacterCondition {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeApplyCharacterCondition): Promise<CharacterApi> {
    return this.characterService.applyCharacterCondition(data);
  }
}
