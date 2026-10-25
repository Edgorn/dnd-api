import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeRestCharacter } from "../../../domain/types/character.types";

export default class RestCharacter {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeRestCharacter): Promise<CharacterApi> {
    return this.characterService.restCharacter(data);
  }
}
