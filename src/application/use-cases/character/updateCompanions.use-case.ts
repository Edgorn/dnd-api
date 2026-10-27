import ICharacterRepository from "../../../domain/repositories/ICharacterRepository";
import ICreatureRepository from "../../../domain/repositories/ICreatureRepository";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import {
  CharacterCompanionInput,
  UpdateCharacterCompanionsResponse,
} from "../../../domain/types/character.types";
import { assertCompanionCreature } from "../../../utils/assertCompanionCreature";
import { mergeCompanionsOnReplace } from "../../../utils/normalizeCompanions";

export default class UpdateCompanions {
  constructor(
    private readonly characterRepository: ICharacterRepository,
    private readonly creatureRepository: ICreatureRepository,
    private readonly systemRepository: ISystemRepository
  ) {}

  async execute(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.characterRepository.getCompanionRoster(id, userId);
    const merged = mergeCompanionsOnReplace(companions, roster.companions);
    const allowedRulesets = await this.systemRepository.getSystemsAndAncestors(roster.systems);

    for (const companion of merged) {
      await assertCompanionCreature(this.creatureRepository, allowedRulesets, companion);
    }

    return this.characterRepository.saveCompanions(id, userId, merged);
  }
}
