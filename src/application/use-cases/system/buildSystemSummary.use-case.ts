import SystemService from "../../../domain/services/system.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import IRaceRepository from "../../../domain/repositories/IRaceRepository";
import { System, SystemSummary } from "../../../domain/types/system.types";
import { rulesetKeysFromGraph, sumRacesCountForSystem, toSystemSummary } from "./toSystemSummary";

export default class BuildSystemSummary {
  constructor(
    private readonly systemService: SystemService,
    private readonly userRepository: IUserRepository,
    private readonly raceRepository: IRaceRepository
  ) {}

  async execute(system: System, userId: string): Promise<SystemSummary> {
    const graph = await this.systemService.getAncestorGraph([system]);
    const counts = await this.raceRepository.countRootRacesByRulesets(rulesetKeysFromGraph(graph));
    const users = system.publisher
      ? await this.userRepository.getUsers([system.publisher])
      : [];
    const publisherName = users[0]?.name ?? system.publisher;

    return toSystemSummary(system, {
      publisherName,
      userId,
      racesCount: sumRacesCountForSystem(system, graph, counts),
    });
  }
}
