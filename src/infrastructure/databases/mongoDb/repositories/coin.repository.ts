import { Types } from "mongoose";
import ICoinRepository from "../../../../domain/repositories/ICoinRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { NotFoundError } from "../../../../domain/errors/AppError";
import { CoinApi, CoinMongo, InputCreateCoin, InputUpdateCoin } from "../../../../domain/types/coin.types";
import CoinModel from "../schemas/Coin";
import { ordenarPorNombre } from "../../../../utils/formatters";

export default class CoinRepository implements ICoinRepository {
  constructor(
    private readonly systemRepository?: ISystemRepository
  ) {}

  async create(data: InputCreateCoin): Promise<CoinApi> {
    const newCoin = new CoinModel({
      ruleset: data.ruleset,
      name: data.name,
      abbreviation: data.abbreviation,
      isBase: data.isBase ?? false,
      multiplier: data.multiplier,
      weight: data.weight,
      color: data.color
    });

    await newCoin.save();
    return this.formatCoin(newCoin);
  }

  async update(data: InputUpdateCoin): Promise<CoinApi> {
    const { id, ...updateFields } = data;
    const updatedCoin = await CoinModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedCoin) {
      throw new NotFoundError(`No se encontró la moneda con id: ${id}`);
    }

    return this.formatCoin(updatedCoin);
  }

  async getById(id: string): Promise<CoinApi | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const coin = await CoinModel.findById(id).lean<CoinMongo>();
    if (!coin) return null;
    return this.formatCoin(coin);
  }

  async getCoinsByIds(ids: string[]): Promise<CoinApi[]> {
    const validIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      return [];
    }
    const coins = await CoinModel.find({ _id: { $in: validIds } }).lean<CoinMongo[]>();
    return coins.map(c => this.formatCoin(c));
  }

  async getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<CoinApi[]> {
    let expandedRulesets = rulesets;
    if (this.systemRepository && rulesets.length > 0) {
      expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    }

    const query: any = expandedRulesets.length > 0
      ? { ruleset: { $in: expandedRulesets } }
      : {};

    if (!includeDeleted) {
      query.deletedAt = null;
    }

    const coins = await CoinModel.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 })
      .lean<CoinMongo[]>();

    const formatted = coins.map(c => this.formatCoin(c));
    return ordenarPorNombre(formatted);
  }

  async softDelete(id: string): Promise<void> {
    const result = await CoinModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    if (!result) {
      throw new NotFoundError(`No se encontró la moneda con id: ${id}`);
    }
  }

  async restore(id: string): Promise<void> {
    const result = await CoinModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
    if (!result) {
      throw new NotFoundError(`No se encontró la moneda con id: ${id}`);
    }
  }

  private formatCoin(coin: any): CoinApi {
    return {
      id: coin._id ? coin._id.toString() : "",
      ruleset: coin.ruleset || "",
      name: coin.name,
      abbreviation: coin.abbreviation,
      isBase: coin.isBase ?? false,
      multiplier: coin.multiplier,
      weight: coin.weight,
      color: coin.color ?? "#000000",
      deletedAt: coin.deletedAt ?? null
    };
  }
}
