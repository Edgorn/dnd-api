import CreatureTypeService from "../../../domain/services/creatureType.service";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import { RaceDetailApi, UpdateRace } from "../../../domain/types/race.types";
import { assertCreatureTypeForRuleset, assertSubracePlayable } from "./assertRaceCreatureRules";
import GetRaceByIdUseCase from "./getRaceById.use-case";

export default class UpdateRaceUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly creatureTypeService: CreatureTypeService,
    private readonly systemService: SystemService,
    private readonly getRaceById: GetRaceByIdUseCase
  ) { }

  async execute(race: UpdateRace): Promise<RaceDetailApi | undefined> {
    const existing = await this.raceService.getById(race.id);
    if (!existing) return undefined;

    const ruleset = race.ruleset ?? existing.ruleset;
    if (race.creatureTypeId) {
      await assertCreatureTypeForRuleset(
        race.creatureTypeId,
        ruleset,
        this.creatureTypeService,
        this.systemService
      );
    }

    const playable = race.playable !== undefined ? race.playable : existing.playable;
    const parentId = race.parentId !== undefined ? race.parentId : existing.parentId;
    await assertSubracePlayable(playable, parentId, this.raceService);

    const updated = await this.raceService.update(race);
    if (!updated) return undefined;
    return this.getRaceById.execute(updated.id);
  }
}
