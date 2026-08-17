import ICoinRepository from "../../../domain/repositories/ICoinRepository";
import { CoinApi, InputCreateCoin } from "../../../domain/types/coin.types";

export default class CreateCoin {
  constructor(private readonly coinRepository: ICoinRepository) {}

  async execute(data: InputCreateCoin): Promise<CoinApi> {
    return this.coinRepository.create(data);
  }
}
