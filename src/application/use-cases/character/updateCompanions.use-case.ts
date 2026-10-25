import CharacterService from "../../../domain/services/character.service";
import {
  CharacterCompanionInput,
  UpdateCharacterCompanionsResponse,
} from "../../../domain/types/character.types";

export default class UpdateCompanions {
  constructor(private readonly characterService: CharacterService) {}

  execute(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    return this.characterService.updateCompanions(id, companions, userId);
  }
}
