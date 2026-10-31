import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceSummary, RaceSummaryDraft } from "../../../domain/types/race.types";
import {
  ancestryRulesets,
  ancestryToRefs,
  applyRaceOverrides,
  raceDescriptionTeaser
} from "../../../utils/applyRaceOverrides";
import { pruneRaceForest } from "../../../utils/catalogExclusions";

export default class GetRaceSummariesUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) { }

  async execute(ruleset?: string, playable?: boolean): Promise<RaceSummary[]> {
    const drafts = await this.raceService.getSummaries(ruleset, playable);
    if (!ruleset) {
      return drafts.map(toRaceSummary);
    }

    const exclusions = await this.systemService.getResolvedCatalogExclusions([ruleset]);
    const ancestry = await this.systemService.getAncestry(ruleset);
    if (ancestry.length === 0) {
      return pruneRaceForest(drafts.map(toRaceSummary), exclusions.raceIds);
    }

    const overlays = await this.entityOverrideService.getBySystems(
      ancestryRulesets(ancestry),
      "race"
    );

    return pruneRaceForest(
      applyRaceOverrides(drafts, overlays, ancestryToRefs(ancestry)).map(toRaceSummary),
      exclusions.raceIds
    );
  }
}

export function toRaceSummary(draft: RaceSummaryDraft): RaceSummary {
  const { description, subraces, ...rest } = draft;
  return {
    ...rest,
    descriptionTeaser: raceDescriptionTeaser(description),
    ...(subraces
      ? { subraces: { name: subraces.name, list: subraces.list.map(toRaceSummary) } }
      : {})
  };
}
