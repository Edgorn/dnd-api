import CharacterService from "../../../domain/services/character.service";
import { CharacterStatePatch, TypeSpendHitDice } from "../../../domain/types/character.types";

export default class SpendHitDice {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeSpendHitDice): Promise<CharacterStatePatch> {
    return this.characterService.spendHitDice(data);
  }
}
