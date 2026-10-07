import { CreateRace, RaceApi, RaceCatalogItem, RaceLevelMongo, RaceRef, RaceSummaryDraft, UpdateRace } from "../types/race.types";

export interface RaceSummarySubtree {
  name: string;
  list: RaceSummaryDraft[];
}
import { AttributeApi } from "../types/attribute.types";

export default interface IRaceRepository {
  getAll(playable?: boolean): Promise<RaceApi[]>
  getBySystem(ruleset: string, playable?: boolean): Promise<RaceApi[]>
  getById(id: string, allowedRulesets?: string[]): Promise<RaceApi | undefined>
  getSummaries(ruleset?: string, playable?: boolean): Promise<RaceSummaryDraft[]>
  getSummarySubtree(parentId: string, ruleset?: string): Promise<RaceSummarySubtree | undefined>
  getCatalog(ruleset?: string, playable?: boolean): Promise<RaceCatalogItem[]>
  create(race: CreateRace): Promise<RaceApi>
  update(race: UpdateRace): Promise<RaceApi | undefined>
  getLevelUpData(raceId: string, level: number): Promise<RaceLevelMongo | undefined>
  getSpellcastingAttribute(raceId: string): Promise<AttributeApi | undefined>
  softDelete(id: string): Promise<boolean>
  restore(id: string): Promise<boolean>
  getRaceRefsByIds(ids: string[]): Promise<RaceRef[]>
  getRaceRefsBySystems(rulesets: string[]): Promise<RaceRef[]>
  countRootRacesByRulesets(rulesets: string[]): Promise<Map<string, number>>
}
