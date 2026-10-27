import ICharacterRepository from "../../../domain/repositories/ICharacterRepository";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError";
import { UpdateCharacterCompanionsResponse } from "../../../domain/types/character.types";
import {
  companionRemovalConflict,
  companionRemovalConflictMessage,
} from "../../../utils/normalizeCompanions";

export default class RemoveCompanion {
  constructor(private readonly characterRepository: ICharacterRepository) {}

  async execute(
    id: string,
    userId: string,
    companionId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.characterRepository.getCompanionRoster(id, userId);
    if (!roster.companions.some(item => item.id === companionId)) {
      throw new NotFoundError("Compañero no encontrado");
    }

    const conflict = companionRemovalConflict(roster.inventory, companionId);
    if (conflict) {
      throw new ConflictError(companionRemovalConflictMessage(conflict));
    }

    return this.characterRepository.removeCompanion(id, userId, companionId);
  }
}
