import ICoinRepository from "../../../domain/repositories/ICoinRepository";
import { CoinApi } from "../../../domain/types/coin.types";

export default class GetCoins {
  constructor(private readonly coinRepository: ICoinRepository) {}

  async execute(rulesets: string[], includeDeleted: boolean = false): Promise<CoinApi[]> {
    return this.coinRepository.getBySystems(rulesets, includeDeleted);
  }
}
