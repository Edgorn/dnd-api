import CharacterService from "../../../domain/services/character.service";
import { CharacterListItem, GetCharactersByUserOptions } from "../../../domain/types/character.types";

export default class GetCharactersByUser {
  constructor(private readonly characterService: CharacterService) { }

  execute(id: string, options?: GetCharactersByUserOptions): Promise<CharacterListItem[]> {
    return this.characterService.getByUser(id, options)
  }
}
