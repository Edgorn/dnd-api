import ICharacterRepository from "../../../domain/repositories/ICharacterRepository";
import ICreatureRepository from "../../../domain/repositories/ICreatureRepository";
import { NotFoundError } from "../../../domain/errors/AppError";
import {
  CharacterCompanion,
  UpdateCharacterCompanionsResponse,
  UpdateCompanionInput,
} from "../../../domain/types/character.types";
import { clipCompanionHp } from "../../../utils/normalizeCompanions";

export default class UpdateCompanion {
  constructor(
    private readonly characterRepository: ICharacterRepository,
    private readonly creatureRepository: ICreatureRepository
  ) {}

  async execute(
    id: string,
    userId: string,
    companionId: string,
    input: UpdateCompanionInput
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.characterRepository.getCompanionRoster(id, userId);
    const companion = roster.companions.find(item => item.id === companionId);
    if (!companion) {
      throw new NotFoundError("Compañero no encontrado");
    }

    const patch: Partial<CharacterCompanion> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.role !== undefined) patch.role = input.role;
    if (input.notes !== undefined) patch.notes = input.notes;
    if (input.conditions !== undefined) patch.conditions = input.conditions;

    if (input.hpCurrent !== undefined) {
      let hpMax: number | undefined;
      if (companion.creatureId) {
        const creature = await this.creatureRepository.getById(companion.creatureId);
        if (creature && !creature.deletedAt) {
          hpMax = creature.HPMax;
        }
      }
      patch.hpCurrent = clipCompanionHp(input.hpCurrent, hpMax);
    }

    return this.characterRepository.updateCompanion(id, userId, companionId, patch);
  }
}
