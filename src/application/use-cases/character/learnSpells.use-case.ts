import CharacterService from "../../../domain/services/character.service";
import { CharacterSpellStateResponse, TypeLearnSpells } from "../../../domain/types/character.types";

export default class LearnSpells {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeLearnSpells): Promise<CharacterSpellStateResponse> {
    return this.characterService.learnSpells(data);
  }
}
