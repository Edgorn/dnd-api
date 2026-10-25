import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeUseTrait } from "../../../domain/types/character.types";

export default class UseTrait {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeUseTrait): Promise<CharacterApi> {
    return this.characterService.useTrait(data);
  }
}
