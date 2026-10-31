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
import { isRaceExcluded, pruneRaceForest } from "../../../utils/catalogExclusions";

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

    const exclusions = await this.systemService.getResolvedCatalogExclusions([ruleset]);
    const ancestorChain: string[] = [];
    let parentId = race.parentId ?? null;
    const seen = new Set<string>([id]);
    while (parentId && !seen.has(parentId)) {
      ancestorChain.push(parentId);
      seen.add(parentId);
      const parent = await this.raceService.getById(parentId, expanded);
      parentId = parent?.parentId ?? null;
    }
    if (isRaceExcluded(id, ancestorChain, exclusions.raceIds)) {
      throw new NotFoundError("No se encontro la raza");
    }

    const subtree = await this.raceService.getSummarySubtree(id, ruleset);
    const prunedLoadedSubtree = subtree
      ? { name: subtree.name, list: pruneRaceForest(subtree.list, exclusions.raceIds) }
      : undefined;
    const ancestry = await this.systemService.getAncestry(ruleset);
    if (ancestry.length === 0) {
      return this.withSummarySubraces(race, prunedLoadedSubtree);
    }

    const overlays = await this.entityOverrideService.getBySystems(
      ancestryRulesets(ancestry),
      "race"
    );
    const refs = ancestryToRefs(ancestry);
    const [patchedRace] = applyRaceOverrides([race], overlays, refs);
    const patchedSubtree = this.patchSubtree(subtree, overlays, refs);
    const prunedSubtree = patchedSubtree
      ? { name: patchedSubtree.name, list: pruneRaceForest(patchedSubtree.list, exclusions.raceIds) }
      : undefined;
    return this.withSummarySubraces(patchedRace, prunedSubtree);
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
