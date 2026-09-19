import { Types } from "mongoose";
import IArmorTypeRepository from "../../../../domain/repositories/IArmorTypeRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { ArmorType, InputCreateArmorType, InputUpdateArmorType } from "../../../../domain/types/armorType.types";
import ArmorTypeModel, { ArmorTypeMongo } from "../schemas/armorType.schema";
import { ordenarPorNombre } from "../../../../utils/formatters";

export default class ArmorTypeRepository implements IArmorTypeRepository {
  constructor(
    private readonly systemRepository?: ISystemRepository
  ) {}

  async create(data: InputCreateArmorType): Promise<ArmorType> {
    try {
      const created = new ArmorTypeModel({
        ruleset: data.ruleset,
        name: data.name,
        description: data.description,
        don: data.don,
        doff: data.doff,
        deletedAt: null
      });

      await created.save();
      return this.formatArmorType(created);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`An armor type with name '${data.name}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateArmorType): Promise<ArmorType> {
    const { id, ...updateFields } = data;
    const $set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        $set[key] = value;
      }
    }

    const updated = await ArmorTypeModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: "after" }
    );

    if (!updated) {
      throw new NotFoundError(`No armor type found with id: ${id}`);
    }

    return this.formatArmorType(updated);
  }

  async getById(id: string): Promise<ArmorType | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const armorType = await ArmorTypeModel.findById(id).lean<ArmorTypeMongo>();
    if (!armorType) return null;
    return this.formatArmorType(armorType);
  }

  async getByIds(ids: string[]): Promise<ArmorType[]> {
    if (!ids || ids.length === 0) return [];

    const validMongoIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validMongoIds.length === 0) return [];

    const armorTypes = await ArmorTypeModel.find({
      _id: { $in: validMongoIds as any },
      deletedAt: null
    }).lean<ArmorTypeMongo[]>();
    return ordenarPorNombre(armorTypes.map(item => this.formatArmorType(item)));
  }

  async getBySystems(rulesets: string[]): Promise<ArmorType[]> {
    let expandedRulesets = rulesets;
    if (this.systemRepository && rulesets.length > 0) {
      expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    }

    const filter = expandedRulesets.length > 0
      ? { ruleset: { $in: expandedRulesets }, deletedAt: null }
      : { deletedAt: null };

    const armorTypes = await ArmorTypeModel.find(filter).lean<ArmorTypeMongo[]>();
    return ordenarPorNombre(armorTypes.map(item => this.formatArmorType(item)));
  }

  async softDelete(id: string): Promise<void> {
    await ArmorTypeModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await ArmorTypeModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await ArmorTypeModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await ArmorTypeModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private formatArmorType(armorType: ArmorTypeMongo | any): ArmorType {
    return {
      id: armorType._id.toString(),
      ruleset: armorType.ruleset || "",
      name: armorType.name,
      description: armorType.description,
      don: armorType.don,
      doff: armorType.doff,
      deletedAt: armorType.deletedAt ?? null
    };
  }
}
