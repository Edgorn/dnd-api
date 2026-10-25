import CharacterService from "../../../domain/services/character.service";
import { CharacterLevelUpResponse, TypeLevelUp } from "../../../domain/types/character.types";

export default class LevelUp {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeLevelUp): Promise<CharacterLevelUpResponse> {
    return this.characterService.levelUp(data);
  }
}
