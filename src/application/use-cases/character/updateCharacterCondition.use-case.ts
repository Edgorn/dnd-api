import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeUpdateCharacterCondition } from "../../../domain/types/character.types";

export default class UpdateCharacterCondition {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeUpdateCharacterCondition): Promise<CharacterApi> {
    return this.characterService.updateCharacterCondition(data);
  }
}
