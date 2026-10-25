import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeCopySpells } from "../../../domain/types/character.types";

export default class CopySpells {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeCopySpells): Promise<CharacterApi> {
    return this.characterService.copySpells(data);
  }
}
