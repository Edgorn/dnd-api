import IRaceRepository, { RaceSummarySubtree } from "../repositories/IRaceRepository";
import { CreateRace, RaceApi, RaceCatalogItem, RaceRef, RaceSummaryDraft, UpdateRace } from "../types/race.types";

export default class RaceService {
  constructor(private readonly raceRepository: IRaceRepository) { }

  getAll(playable?: boolean): Promise<RaceApi[]> {
    return this.raceRepository.getAll(playable);
  }

  getBySystem(ruleset: string, playable?: boolean): Promise<RaceApi[]> {
    return this.raceRepository.getBySystem(ruleset, playable);
  }

  getById(id: string, allowedRulesets?: string[]): Promise<RaceApi | undefined> {
    return this.raceRepository.getById(id, allowedRulesets);
  }

  getSummaries(ruleset?: string, playable?: boolean): Promise<RaceSummaryDraft[]> {
    return this.raceRepository.getSummaries(ruleset, playable);
  }

  getSummarySubtree(parentId: string, ruleset?: string): Promise<RaceSummarySubtree | undefined> {
    return this.raceRepository.getSummarySubtree(parentId, ruleset);
  }

  getCatalog(ruleset?: string, playable?: boolean): Promise<RaceCatalogItem[]> {
    return this.raceRepository.getCatalog(ruleset, playable);
  }

  create(race: CreateRace): Promise<RaceApi> {
    return this.raceRepository.create(race);
  }

  update(race: UpdateRace): Promise<RaceApi | undefined> {
    return this.raceRepository.update(race);
  }

  softDelete(id: string): Promise<boolean> {
    return this.raceRepository.softDelete(id);
  }

  restore(id: string): Promise<boolean> {
    return this.raceRepository.restore(id);
  }

  getRaceRefsByIds(ids: string[]): Promise<RaceRef[]> {
    return this.raceRepository.getRaceRefsByIds(ids);
  }
}
