import ICharacterRepository from "../../../domain/repositories/ICharacterRepository";
import ICreatureRepository from "../../../domain/repositories/ICreatureRepository";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import {
  AddCompanionInput,
  UpdateCharacterCompanionsResponse,
} from "../../../domain/types/character.types";
import { assertCompanionCreature } from "../../../utils/assertCompanionCreature";

export default class AddCompanion {
  constructor(
    private readonly characterRepository: ICharacterRepository,
    private readonly creatureRepository: ICreatureRepository,
    private readonly systemRepository: ISystemRepository
  ) {}

  async execute(
    id: string,
    userId: string,
    input: AddCompanionInput
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.characterRepository.getCompanionRoster(id, userId);
    const kind = input.kind ?? "narrative";
    const allowedRulesets = await this.systemRepository.getSystemsAndAncestors(roster.systems);
    const { hpMax } = await assertCompanionCreature(
      this.creatureRepository,
      allowedRulesets,
      { kind, creatureId: input.creatureId }
    );

    return this.characterRepository.addCompanion(id, userId, {
      ...input,
      kind,
      hpCurrent: hpMax,
    });
  }
}
