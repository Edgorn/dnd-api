import { Types } from "mongoose";
import ICreatureTypeRepository from "../../../../domain/repositories/ICreatureTypeRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { NotFoundError } from "../../../../domain/errors/AppError";
import {
  CreatureTypeApi,
  CreatureTypeMongo,
  InputCreateCreatureType,
  InputUpdateCreatureType
} from "../../../../domain/types/creatureType.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import CreatureTypeModel from "../schemas/CreatureType";

export default class CreatureTypeRepository implements ICreatureTypeRepository {
  constructor(private readonly systemRepository?: ISystemRepository) {}

  async getBySystems(rulesets: string[], userId?: string): Promise<CreatureTypeApi[]> {
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

    const creatureTypes = await CreatureTypeModel.find(rulesetQuery)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<CreatureTypeMongo[]>();

    return ordenarPorNombre(creatureTypes.map(item => this.formatCreatureType(item)));
  }

  async getById(id: string): Promise<CreatureTypeApi | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    const creatureType = await CreatureTypeModel.findById(id).lean<CreatureTypeMongo>();
    if (!creatureType) return null;
    return this.formatCreatureType(creatureType);
  }

  async getByIds(ids: string[]): Promise<CreatureTypeApi[]> {
    if (!ids.length) return [];

    const validMongoIds = ids
      .filter(id => Types.ObjectId.isValid(id))
      .map(id => new Types.ObjectId(id));
    if (!validMongoIds.length) return [];

    const creatureTypes = await CreatureTypeModel.find({
      _id: { $in: validMongoIds as any },
      deletedAt: null
    }).lean<CreatureTypeMongo[]>();

    return ordenarPorNombre(creatureTypes.map(item => this.formatCreatureType(item)));
  }

  async create(data: InputCreateCreatureType): Promise<CreatureTypeApi> {
    const created = new CreatureTypeModel({
      name: data.name,
      description: data.description,
      ruleset: data.ruleset,
      deletedAt: null
    });

    await created.save();
    return this.formatCreatureType(created);
  }

  async update(data: InputUpdateCreatureType): Promise<CreatureTypeApi> {
    const { id, ...updateFields } = data;
    const $set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        $set[key] = value;
      }
    }

    const updated = await CreatureTypeModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: "after" }
    ).lean<CreatureTypeMongo>();

    if (!updated) {
      throw new NotFoundError(`No creature type found with id: ${id}`);
    }

    return this.formatCreatureType(updated);
  }

  async softDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await CreatureTypeModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await CreatureTypeModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await CreatureTypeModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await CreatureTypeModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private formatCreatureType(creatureType: CreatureTypeMongo): CreatureTypeApi {
    return {
      id: creatureType._id.toString(),
      name: creatureType.name,
      description: creatureType.description,
      ruleset: creatureType.ruleset || "",
      deletedAt: creatureType.deletedAt ?? null
    };
  }
}
