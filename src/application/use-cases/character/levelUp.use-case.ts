import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, CharacterBasic, TypeLevelUp } from "../../../domain/types/character.types";

export default class LevelUp {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeLevelUp): Promise<{ full: CharacterApi; basic: CharacterBasic }> {
    return this.characterService.levelUp(data);
  }
}
