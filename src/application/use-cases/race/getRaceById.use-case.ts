import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceDetailApi, RaceSummaryDraft } from "../../../domain/types/race.types";
import { NotFoundError } from "../../../domain/errors/AppError";
import {
  AncestrySystemRef,
  ancestryRulesets,
  ancestryToRefs,
  applyRaceOverrides
} from "../../../utils/applyRaceOverrides";
import { EntityOverrideApi } from "../../../domain/types/entityOverride.types";
import { toRaceSummary } from "./getRaceSummaries.use-case";

export default class GetRaceByIdUseCase {
  constructor(
    private readonly raceService: RaceService,
    private readonly systemService: SystemService,
    private readonly entityOverrideService: EntityOverrideService
  ) { }

  async execute(id: string, ruleset?: string): Promise<RaceDetailApi> {
    if (!ruleset) {
      const race = await this.raceService.getById(id);
      if (!race) {
        throw new NotFoundError("No se encontro la raza");
      }
      return this.withSummarySubraces(race, await this.raceService.getSummarySubtree(id));
    }

    const expanded = await this.systemService.getSystemsAndAncestors([ruleset]);
    const race = await this.raceService.getById(id, expanded);
    if (!race || !expanded.includes(race.ruleset)) {
      throw new NotFoundError("No se encontro la raza");
    }

    const subtree = await this.raceService.getSummarySubtree(id, ruleset);
    const ancestry = await this.systemService.getAncestry(ruleset);
    if (ancestry.length === 0) {
      return this.withSummarySubraces(race, subtree);
    }

    const overlays = await this.entityOverrideService.getBySystems(
      ancestryRulesets(ancestry),
      "race"
    );
    const refs = ancestryToRefs(ancestry);
    const [patchedRace] = applyRaceOverrides([race], overlays, refs);
    return this.withSummarySubraces(patchedRace, this.patchSubtree(subtree, overlays, refs));
  }

  private patchSubtree(
    subtree: { name: string; list: RaceSummaryDraft[] } | undefined,
    overlays: EntityOverrideApi[],
    ancestry: AncestrySystemRef[]
  ): { name: string; list: RaceSummaryDraft[] } | undefined {
    if (!subtree) return undefined;
    return {
      name: subtree.name,
      list: applyRaceOverrides(subtree.list, overlays, ancestry)
    };
  }

  private withSummarySubraces(
    race: RaceDetailApi,
    subtree?: { name: string; list: RaceSummaryDraft[] }
  ): RaceDetailApi {
    const { subraces: _ignored, ...rest } = race;
    if (!subtree?.list.length) {
      return rest;
    }
    return {
      ...rest,
      subraces: {
        name: subtree.name,
        list: subtree.list.map(toRaceSummary)
      }
    };
  }
}
