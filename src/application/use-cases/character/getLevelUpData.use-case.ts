import CharacterService from "../../../domain/services/character.service";
import { LevelUpData } from "../../../domain/types/character.types";

export default class GetLevelUpData {
  constructor(private readonly characterService: CharacterService) {}

  execute(id: string, classId: string, userId: string): Promise<LevelUpData> {
    return this.characterService.getLevelUpData(id, classId, userId);
  }
}
