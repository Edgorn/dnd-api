import SystemService from "../../../domain/services/system.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import IRaceRepository from "../../../domain/repositories/IRaceRepository";
import { SystemKind, SystemSummary } from "../../../domain/types/system.types";
import { rulesetKeysFromGraph, sumRacesCountForSystem, toSystemSummary } from "./toSystemSummary";

export default class GetSystemsByUser {
  constructor(
    private readonly systemService: SystemService,
    private readonly userRepository: IUserRepository,
    private readonly raceRepository: IRaceRepository
  ) {}

  async execute(userId: string, kind?: SystemKind): Promise<SystemSummary[]> {
    const user = await this.userRepository.getUserById(userId);
    const accessibleSystemIds = user?.accessibleSystems || [];
    const systems = await this.systemService.getByUserId(userId, accessibleSystemIds, kind);
    if (systems.length === 0) return [];

    const publisherIds = [...new Set(systems.map((system) => system.publisher).filter(Boolean))];
    const [users, graph] = await Promise.all([
      this.userRepository.getUsers(publisherIds),
      this.systemService.getAncestorGraph(systems),
    ]);

    const publisherNames = new Map(users.map((publisher) => [publisher.id, publisher.name]));
    const counts = await this.raceRepository.countRootRacesByRulesets(rulesetKeysFromGraph(graph));

    return systems.map((system) =>
      toSystemSummary(system, {
        publisherName: publisherNames.get(system.publisher) ?? system.publisher,
        userId,
        racesCount: sumRacesCountForSystem(system, graph, counts),
      })
    );
  }
}
