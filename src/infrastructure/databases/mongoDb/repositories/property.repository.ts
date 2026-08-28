import { Types } from "mongoose";
import IPropertyRepository from "../../../../domain/repositories/IPropertyRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { Property, InputCreateProperty, InputUpdateProperty } from "../../../../domain/types/property.types";
import PropertyModel, { PropertyMongo } from "../schemas/property.schema";
import { ordenarPorNombre } from "../../../../utils/formatters";

export default class PropertyRepository implements IPropertyRepository {
  constructor(
    private readonly systemRepository?: ISystemRepository
  ) {}

  async create(data: InputCreateProperty): Promise<Property> {
    try {
      const newProperty = new PropertyModel({
        ruleset: data.ruleset,
        name: data.name,
        description: data.description,
        deletedAt: null
      });

      await newProperty.save();
      return this.formatProperty(newProperty);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A property with name '${data.name}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateProperty): Promise<Property> {
    const { id, ...updateFields } = data;
    const updatedProperty = await PropertyModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedProperty) {
      throw new NotFoundError(`No property found with id: ${id}`);
    }

    return this.formatProperty(updatedProperty);
  }

  async getById(id: string): Promise<Property | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }
    const property = await PropertyModel.findById(id).lean<PropertyMongo>();
    if (!property) return null;
    return this.formatProperty(property);
  }

  async getByIds(ids: string[]): Promise<Property[]> {
    if (!ids || ids.length === 0) return [];

    const validMongoIds = ids.filter(id => Types.ObjectId.isValid(id));
    if (validMongoIds.length === 0) return [];

    const properties = await PropertyModel.find({ _id: { $in: validMongoIds as any }, deletedAt: null }).lean<PropertyMongo[]>();
    const formatted = properties.map(p => this.formatProperty(p));
    return ordenarPorNombre(formatted);
  }

  async getBySystems(rulesets: string[]): Promise<Property[]> {
    let expandedRulesets = rulesets;
    if (this.systemRepository && rulesets.length > 0) {
      expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    }

    const filter = expandedRulesets.length > 0
      ? { ruleset: { $in: expandedRulesets }, deletedAt: null }
      : { deletedAt: null };

    const properties = await PropertyModel.find(filter).lean<PropertyMongo[]>();
    const formatted = properties.map(p => this.formatProperty(p));
    return ordenarPorNombre(formatted);
  }

  async softDelete(id: string): Promise<void> {
    await PropertyModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await PropertyModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await PropertyModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await PropertyModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private formatProperty(property: PropertyMongo | any): Property {
    return {
      id: property._id.toString(),
      name: property.name,
      description: property.description,
      ruleset: property.ruleset || '',
      deletedAt: property.deletedAt
    };
  }
}
