import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeBindSpellPrivileges } from "../../../domain/types/character.types";

export default class BindSpellPrivileges {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeBindSpellPrivileges): Promise<CharacterApi> {
    return this.characterService.bindSpellPrivileges(data);
  }
}
