import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, TypeSpendHitDice } from "../../../domain/types/character.types";

export default class SpendHitDice {
  constructor(private readonly characterService: CharacterService) {}

  execute(data: TypeSpendHitDice): Promise<CharacterApi> {
    return this.characterService.spendHitDice(data);
  }
}
