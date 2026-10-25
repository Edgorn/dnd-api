import CharacterService from "../../../domain/services/character.service";
import { CharacterApi } from "../../../domain/types/character.types";

export default class GetCharacterById {
  constructor(private readonly characterService: CharacterService) { }

  execute(idCharacter: string, user: string): Promise<CharacterApi> {
    return this.characterService.getById(idCharacter, user)
  }
}
