import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceCatalogItem } from "../../../domain/types/race.types";
import {
  ancestryRulesets,
  ancestryToRefs,
  applyRaceNameOverrides
} from "../../../utils/applyRaceOverrides";

export default class GetRaceCatalogUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) { }

  async execute(ruleset?: string, playable?: boolean): Promise<RaceCatalogItem[]> {
    const catalog = await this.raceService.getCatalog(ruleset, playable);
    if (!ruleset) {
      return catalog;
    }

    const ancestry = await this.systemService.getAncestry(ruleset);
    if (ancestry.length === 0) {
      return catalog;
    }

    const overlays = await this.entityOverrideService.getBySystems(
      ancestryRulesets(ancestry),
      "race"
    );

    return applyRaceNameOverrides(catalog, overlays, ancestryToRefs(ancestry));
  }
}
