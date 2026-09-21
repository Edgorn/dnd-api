import PersonajeService from "../../../domain/services/personaje.service";
import {
  CharacterCompanionInput,
  UpdateCharacterCompanionsResponse,
} from "../../../domain/types/personajes.types";

export default class UpdateCompanions {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    return this.personajeService.updateCompanions(id, companions, userId);
  }
}
