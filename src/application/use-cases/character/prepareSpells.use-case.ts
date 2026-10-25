import CharacterService from "../../../domain/services/character.service";
import { CharacterSpellStateResponse, TypePrepareSpells } from "../../../domain/types/character.types";

export default class PrepareSpells {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypePrepareSpells): Promise<CharacterSpellStateResponse> {
    return this.characterService.prepareSpells(data);
  }
}
