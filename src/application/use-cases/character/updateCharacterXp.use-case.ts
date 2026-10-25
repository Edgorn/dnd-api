import CharacterService from "../../../domain/services/character.service";
import { UpdateCharacterXpResponse } from "../../../domain/types/character.types";

export default class UpdateCharacterXp {
  constructor(private readonly characterService: CharacterService) {}

  execute(id: string, xp: number, userId: string): Promise<UpdateCharacterXpResponse> {
    return this.characterService.updateXp(id, xp, userId);
  }
}
