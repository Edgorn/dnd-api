import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeRemoveCharacterCondition } from "../../../domain/types/character.types";

export default class RemoveCharacterCondition {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeRemoveCharacterCondition): Promise<CharacterStatePatch> {
    return this.characterService.removeCharacterCondition(data);
  }
}
