import ICoinRepository from "../../../domain/repositories/ICoinRepository";
import SystemService from "../../../domain/services/system.service";
import { CoinApi } from "../../../domain/types/coin.types";
import { loadResolvedCatalogs } from "../shared/resolveInheritedCatalog";

export default class GetCoins {
  constructor(
    private readonly coinRepository: ICoinRepository,
    private readonly systemService: SystemService
  ) {}

  async execute(rulesets: string[], includeDeleted: boolean = false): Promise<CoinApi[]> {
    if (rulesets.length === 0) {
      return this.coinRepository.getBySystems(rulesets, includeDeleted);
    }

    return loadResolvedCatalogs(
      rulesets,
      (id) => this.systemService.getAncestry(id),
      (keys) => this.coinRepository.getBySystems(keys, includeDeleted, false),
      {
        identityOf: (item) => item.name,
        rulesetOf: (item) => item.ruleset,
      }
    );
  }
}
