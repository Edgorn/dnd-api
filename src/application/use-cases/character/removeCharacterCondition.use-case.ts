import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeRemoveCharacterCondition } from "../../../domain/types/character.types";

export default class RemoveCharacterCondition {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeRemoveCharacterCondition): Promise<CharacterApi> {
    return this.characterService.removeCharacterCondition(data);
  }
}
