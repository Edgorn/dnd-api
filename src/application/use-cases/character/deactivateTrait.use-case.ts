import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeUseTrait } from "../../../domain/types/character.types";

export default class DeactivateTrait {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeUseTrait): Promise<CharacterStatePatch> {
    return this.characterService.deactivateTrait(data);
  }
}
