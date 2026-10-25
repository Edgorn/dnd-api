import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeLearnSpells } from "../../../domain/types/character.types";

export default class LearnSpells {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeLearnSpells): Promise<CharacterApi> {
    return this.characterService.learnSpells(data);
  }
}
