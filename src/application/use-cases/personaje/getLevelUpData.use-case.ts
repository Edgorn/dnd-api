import PersonajeService from "../../../domain/services/personaje.service";
import { LevelUpData } from "../../../domain/types/personajes.types";

export default class GetLevelUpData {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(id: string, classId: string, userId: string): Promise<LevelUpData> {
    return this.personajeService.getLevelUpData(id, classId, userId);
  }
}
