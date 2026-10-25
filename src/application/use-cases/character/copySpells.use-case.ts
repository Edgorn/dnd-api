import CharacterService from "../../../domain/services/character.service";
import { CharacterSpellStateResponse, TypeCopySpells } from "../../../domain/types/character.types";

export default class CopySpells {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeCopySpells): Promise<CharacterSpellStateResponse> {
    return this.characterService.copySpells(data);
  }
}
