import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeRestCharacter } from "../../../domain/types/character.types";

export default class RestCharacter {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeRestCharacter): Promise<CharacterStatePatch> {
    return this.characterService.restCharacter(data);
  }
}
