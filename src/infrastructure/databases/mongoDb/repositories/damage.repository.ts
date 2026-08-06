import { Types } from "mongoose";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { Damage, InputCreateDamage, InputUpdateDamage } from "../../../../domain/types/damage.types";
import DamageModel, { DamageMongo } from "../schemas/Damage";
import { ordenarPorNombre } from "../../../../utils/formatters";

export default class DamageRepository implements IDamageRepository {
  constructor(
    private readonly systemRepository?: ISystemRepository
  ) {}

  async create(data: InputCreateDamage): Promise<Damage> {
    try {
      const newDamage = new DamageModel({
        ruleset: data.ruleset,
        name: data.name,
        description: data.description,
        color: data.color
      });

      await newDamage.save();
      return this.formatDamage(newDamage);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A damage type with name '${data.name}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateDamage): Promise<Damage> {
    const { id, ...updateFields } = data;
    const updatedDamage = await DamageModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedDamage) {
      throw new NotFoundError(`No damage type found with id: ${id}`);
    }

    return this.formatDamage(updatedDamage);
  }

  async getById(id: string): Promise<Damage | null> {
    if (!Types.ObjectId.isValid(id)) {
      console.error(`[DamageRepository] Se ignoró la búsqueda de Daño por ID inválido (índice antiguo): ${id}`);
      return null;
    }
    const damage = await DamageModel.findById(id).lean<DamageMongo>();
    if (!damage) return null;
    return this.formatDamage(damage);
  }

  async getByIds(ids: string[]): Promise<Damage[]> {
    if (!ids || ids.length === 0) return [];

    const validMongoIds = ids.filter(id => Types.ObjectId.isValid(id));
    const invalidIds = ids.filter(id => !Types.ObjectId.isValid(id));

    if (invalidIds.length > 0) {
      console.error(`[DamageRepository] Daños ignorados por tener IDs inválidos (índices antiguos): ${invalidIds.join(', ')}`);
    }

    if (validMongoIds.length === 0) return [];

    const damages = await DamageModel.find({ _id: { $in: validMongoIds as any }, deletedAt: null });
    const formatted = damages.map(d => this.formatDamage(d));
    return ordenarPorNombre(formatted);
  }

  async getBySystems(rulesets: string[]): Promise<Damage[]> {
    let expandedRulesets = rulesets;
    if (this.systemRepository && rulesets.length > 0) {
      expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    }

    const filter = expandedRulesets.length > 0
      ? { ruleset: { $in: expandedRulesets }, deletedAt: null }
      : { deletedAt: null };

    const damages = await DamageModel.find(filter);
    const formatted = damages.map(d => this.formatDamage(d));
    return ordenarPorNombre(formatted);
  }

  async softDelete(id: string): Promise<void> {
    await DamageModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await DamageModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await DamageModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await DamageModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private formatDamage(damage: DamageMongo): Damage {
    return {
      id: damage._id.toString(),
      name: damage.name,
      description: damage.description,
      color: damage.color,
      ruleset: damage.ruleset || '',
      deletedAt: damage.deletedAt
    };
  }
}
