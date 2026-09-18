import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceApi } from "../../../domain/types/race.types";
import {
  ancestryRulesets,
  ancestryToRefs,
  applyRaceOverrides
} from "../../../utils/applyRaceOverrides";

export default class GetAllRacesUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) { }

  async execute(ruleset?: string): Promise<RaceApi[]> {
    if (!ruleset) {
      return this.raceService.obtenerTodas();
    }

    const races = await this.raceService.obtenerPorSistema(ruleset);
    const ancestry = await this.systemService.getAncestry(ruleset);
    if (ancestry.length === 0) {
      return races;
    }

    const overlays = await this.entityOverrideService.getBySystems(
      ancestryRulesets(ancestry),
      "race"
    );

    return applyRaceOverrides(races, overlays, ancestryToRefs(ancestry));
  }
}
