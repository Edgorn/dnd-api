import CharacterService from "../../../domain/services/character.service";
import { CharacterGetResult, GetCharacterOptions } from "../../../domain/types/character.types";

export default class GetCharacterById {
  constructor(private readonly characterService: CharacterService) { }

  execute(idCharacter: string, user: string, options?: GetCharacterOptions): Promise<CharacterGetResult> {
    return this.characterService.getById(idCharacter, user, options)
  }
}
