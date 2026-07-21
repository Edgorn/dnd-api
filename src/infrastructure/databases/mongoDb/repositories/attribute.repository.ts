import IAttributeRepository from "../../../../domain/repositories/IAttributeRepository";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { AttributeApi, InputCreateAttribute, InputUpdateAttribute, AttributeMongo } from "../../../../domain/types/attribute.types";
import AttributeSchema from "../schemas/Attribute";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";

export default class AttributeRepository implements IAttributeRepository {
  constructor(
    private readonly systemRepository: ISystemRepository
  ) { }

  async create(data: InputCreateAttribute): Promise<AttributeApi> {
    try {
      const newAttribute = new AttributeSchema({
        ruleset: data.ruleset,
        name: data.name,
        description: data.description,
        key: data.key,
        abbreviation: data.abbreviation,
        icon: data.icon
      });

      await newAttribute.save();
      return this.formatAttribute(newAttribute);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`An attribute with key '${data.key}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateAttribute): Promise<AttributeApi> {
    const { id, ...updateFields } = data;
    const updatedAttribute = await AttributeSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedAttribute) {
      throw new NotFoundError(`No attribute found with id: ${id}`);
    }

    return this.formatAttribute(updatedAttribute);
  }

  async getBySystems(rulesets: string[]): Promise<AttributeApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const attributes = await AttributeSchema.find({ ruleset: { $in: expandedRulesets }, deletedAt: null });
    return attributes.map(a => this.formatAttribute(a));
  }



  private formatAttribute(attribute: AttributeMongo): AttributeApi {
    return {
      id: attribute._id.toString(),
      ruleset: attribute.ruleset || '',
      name: attribute.name,
      description: attribute.description,
      key: attribute.key,
      abbreviation: attribute.abbreviation,
      icon: attribute.icon
    };
  }

  async getById(id: string): Promise<AttributeApi | null> {
    const attribute = await AttributeSchema.findById(id).lean<AttributeMongo>();
    if (!attribute) return null;
    return this.formatAttribute(attribute);
  }

  async softDelete(id: string): Promise<void> {
    await AttributeSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await AttributeSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await AttributeSchema.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await AttributeSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }
}
