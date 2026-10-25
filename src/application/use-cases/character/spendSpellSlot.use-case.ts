import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeSpendSpellSlot } from "../../../domain/types/character.types";

export default class SpendSpellSlot {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeSpendSpellSlot): Promise<CharacterApi> {
    return this.characterService.spendSpellSlot(data);
  }
}
