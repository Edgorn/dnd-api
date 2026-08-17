import ICoinRepository from "../../../domain/repositories/ICoinRepository";
import { CoinApi, InputUpdateCoin } from "../../../domain/types/coin.types";

export default class UpdateCoin {
  constructor(private readonly coinRepository: ICoinRepository) {}

  async execute(data: InputUpdateCoin): Promise<CoinApi> {
    return this.coinRepository.update(data);
  }
}
