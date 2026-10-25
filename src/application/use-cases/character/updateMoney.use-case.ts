import CharacterService from "../../../domain/services/character.service";
import { UpdateCharacterMoneyResponse } from "../../../domain/types/character.types";

export default class UpdateMoney {
  constructor(private readonly characterService: CharacterService) { }

  execute(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    return this.characterService.updateMoney(id, money);
  }
}
