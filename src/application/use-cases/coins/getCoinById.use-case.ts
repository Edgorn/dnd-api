import ICoinRepository from "../../../domain/repositories/ICoinRepository";
import { CoinApi } from "../../../domain/types/coin.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GetCoinById {
  constructor(private readonly coinRepository: ICoinRepository) {}

  async execute(id: string): Promise<CoinApi> {
    const coin = await this.coinRepository.getById(id);
    if (!coin) {
      throw new NotFoundError(`No se encontró la moneda con id: ${id}`);
    }
    return coin;
  }
}
