import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeSpendSpellSlot } from "../../../domain/types/character.types";

export default class SpendSpellSlot {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeSpendSpellSlot): Promise<CharacterStatePatch> {
    return this.characterService.spendSpellSlot(data);
  }
}
