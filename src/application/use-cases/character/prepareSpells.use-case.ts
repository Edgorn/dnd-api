import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypePrepareSpells } from "../../../domain/types/character.types";

export default class PrepareSpells {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypePrepareSpells): Promise<CharacterApi> {
    return this.characterService.prepareSpells(data);
  }
}
