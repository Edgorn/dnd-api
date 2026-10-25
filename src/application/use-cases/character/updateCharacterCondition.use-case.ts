import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeUpdateCharacterCondition } from "../../../domain/types/character.types";

export default class UpdateCharacterCondition {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeUpdateCharacterCondition): Promise<CharacterStatePatch> {
    return this.characterService.updateCharacterCondition(data);
  }
}
