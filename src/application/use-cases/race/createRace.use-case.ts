import CreatureTypeService from "../../../domain/services/creatureType.service";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import { CreateRace, RaceApi } from "../../../domain/types/race.types";
import { assertCreatureTypeForRuleset, assertSubracePlayable } from "./assertRaceCreatureRules";

export default class CreateRaceUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly creatureTypeService: CreatureTypeService,
    private readonly systemService: SystemService
  ) { }

  async execute(race: CreateRace): Promise<RaceApi> {
    const playable = race.playable ?? true;
    await assertCreatureTypeForRuleset(
      race.creatureTypeId,
      race.ruleset,
      this.creatureTypeService,
      this.systemService
    );
    await assertSubracePlayable(playable, race.parentId, this.raceService);
    return this.raceService.crear({ ...race, playable });
  }
}
