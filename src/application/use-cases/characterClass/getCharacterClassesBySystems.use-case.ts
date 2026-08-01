import CharacterClassService from "../../../domain/services/characterClass.service";
import { CharacterClassApi } from "../../../domain/types/characterClass.types";

export default class GetCharacterClassesBySystems {
  constructor(private readonly characterClassService: CharacterClassService) { }

  async execute(systems?: string[]): Promise<CharacterClassApi[]> {
    if (!systems || systems.length === 0) {
      return [];
    }
    return this.characterClassService.getBySystems(systems);
  }
}
