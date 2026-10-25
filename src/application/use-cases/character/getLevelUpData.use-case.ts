import CharacterService from "../../../domain/services/character.service";
import { GetLevelUpDataOptions, LevelUpDataResult } from "../../../domain/types/character.types";

export default class GetLevelUpData {
  constructor(private readonly characterService: CharacterService) {}

  execute(id: string, classId: string, userId: string, options?: GetLevelUpDataOptions): Promise<LevelUpDataResult> {
    return this.characterService.getLevelUpData(id, classId, userId, options);
  }
}
