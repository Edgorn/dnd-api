import { Types } from "mongoose";
import IConditionRepository from "../../../../domain/repositories/IConditionRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { NotFoundError } from "../../../../domain/errors/AppError";
import {
  ConditionApi,
  ConditionLevel,
  ConditionMongo,
  InputCreateCondition,
  InputUpdateCondition
} from "../../../../domain/types/condition.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import ConditionModel from "../schemas/Condition";

export default class ConditionRepository implements IConditionRepository {
  constructor(private readonly systemRepository?: ISystemRepository) {}

  async getBySystems(rulesets: string[], userId?: string): Promise<ConditionApi[]> {
    const expandedRulesets = this.systemRepository
      ? await this.systemRepository.getSystemsAndAncestors(rulesets)
      : rulesets;

    const rulesetQuery: { ruleset: { $in: string[] }; deletedAt?: null } = {
      ruleset: { $in: expandedRulesets }
    };

    let includeDeleted = false;
    if (userId && this.systemRepository) {
      for (const ruleset of expandedRulesets) {
        const system = await this.systemRepository.getById(ruleset);
        if (system && system.publisher === userId) {
          includeDeleted = true;
          break;
        }
      }
    }

    if (!includeDeleted) {
      rulesetQuery.deletedAt = null;
    }

    const conditions = await ConditionModel.find(rulesetQuery)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<ConditionMongo[]>();

    return ordenarPorNombre(conditions.map(item => this.formatCondition(item)));
  }

  async getById(id: string): Promise<ConditionApi | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const condition = await ConditionModel.findById(id).lean<ConditionMongo>();
    if (!condition) return null;
    return this.formatCondition(condition);
  }

  async getByIds(ids: string[]): Promise<ConditionApi[]> {
    if (!ids.length) return [];

    const validMongoIds = ids
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));
    if (!validMongoIds.length) return [];

    const conditions = await ConditionModel.find({
      _id: { $in: validMongoIds as any },
      deletedAt: null
    }).lean<ConditionMongo[]>();

    return ordenarPorNombre(conditions.map(item => this.formatCondition(item)));
  }

  async create(data: InputCreateCondition): Promise<ConditionApi> {
    const created = new ConditionModel({
      name: data.name,
      description: data.description,
      ruleset: data.ruleset,
      levels: data.levels,
      cumulative: data.cumulative,
      deletedAt: null
    });

    await created.save();
    return this.formatCondition(created);
  }

  async update(data: InputUpdateCondition): Promise<ConditionApi> {
    if (!Types.ObjectId.isValid(data.id)) {
      throw new NotFoundError(`No condition found with id: ${data.id}`);
    }

    const { id, ...updateFields } = data;
    const $set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        $set[key] = value;
      }
    }

    const updated = await ConditionModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: "after" }
    ).lean<ConditionMongo>();

    if (!updated) {
      throw new NotFoundError(`No condition found with id: ${id}`);
    }

    return this.formatCondition(updated);
  }

  async softDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await ConditionModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await ConditionModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await ConditionModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await ConditionModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private formatCondition(condition: ConditionMongo): ConditionApi {
    const formatted: ConditionApi = {
      id: condition._id.toString(),
      name: condition.name,
      description: condition.description,
      ruleset: condition.ruleset || "",
      deletedAt: condition.deletedAt ?? null
    };

    const levels = this.formatLevels(condition.levels);
    if (levels !== undefined) {
      formatted.levels = levels;
    }
    if (condition.cumulative !== undefined) {
      formatted.cumulative = condition.cumulative;
    }

    return formatted;
  }

  private formatLevels(levels: unknown): ConditionLevel[] | undefined {
    if (!Array.isArray(levels)) {
      return undefined;
    }

    return levels.map((item: ConditionLevel) => ({
      level: item.level,
      description: item.description
    }));
  }
}
