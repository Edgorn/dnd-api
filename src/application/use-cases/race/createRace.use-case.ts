import CreatureTypeService from "../../../domain/services/creatureType.service";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import { CreateRace, RaceDetailApi } from "../../../domain/types/race.types";
import { assertCreatureTypeForRuleset, assertSubracePlayable } from "./assertRaceCreatureRules";
import GetRaceByIdUseCase from "./getRaceById.use-case";

export default class CreateRaceUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly creatureTypeService: CreatureTypeService,
    private readonly systemService: SystemService,
    private readonly getRaceById: GetRaceByIdUseCase
  ) { }

  async execute(race: CreateRace): Promise<RaceDetailApi> {
    const playable = race.playable ?? true;
    await assertCreatureTypeForRuleset(
      race.creatureTypeId,
      race.ruleset,
      this.creatureTypeService,
      this.systemService
    );
    await assertSubracePlayable(playable, race.parentId, this.raceService);
    const saved = await this.raceService.create({ ...race, playable });
    return this.getRaceById.execute(saved.id);
  }
}
