import { CoinApi, InputCreateCoin, InputUpdateCoin } from "../types/coin.types";

export default interface ICoinRepository {
  getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<CoinApi[]>;
  getById(id: string): Promise<CoinApi | null>;
  getCoinsByIds(ids: string[]): Promise<CoinApi[]>;
  create(data: InputCreateCoin): Promise<CoinApi>;
  update(data: InputUpdateCoin): Promise<CoinApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
}
