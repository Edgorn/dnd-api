import CharacterService from "../../../domain/services/character.service";
import { CharacterBasic } from "../../../domain/types/character.types";

export default class GetCharactersByUser {
  constructor(private readonly characterService: CharacterService) { }

  execute(id: string): Promise<CharacterBasic[]> {
    return this.characterService.getByUser(id)
  }
}
