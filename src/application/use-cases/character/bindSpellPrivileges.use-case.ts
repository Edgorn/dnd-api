import CharacterService from "../../../domain/services/character.service";
import { CharacterSpellStateResponse, TypeBindSpellPrivileges } from "../../../domain/types/character.types";

export default class BindSpellPrivileges {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeBindSpellPrivileges): Promise<CharacterSpellStateResponse> {
    return this.characterService.bindSpellPrivileges(data);
  }
}
