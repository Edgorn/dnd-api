import IAttributeRepository from "../../../../domain/repositories/IAttributeRepository";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { AttributeApi, InputCreateAttribute, InputUpdateAttribute, AttributeBonus, AttributeBonusCreate, CharacterAttributeApi, AttributeMongo } from "../../../../domain/types/attribute.types";
import { ChoiceMongo, ChoiceApi } from "../../../../domain/types";
import AttributeSchema from "../schemas/Attribute";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";

export default class AttributeRepository implements IAttributeRepository {
  constructor(
    private readonly systemRepository: ISystemRepository
  ) { }

  async create(data: InputCreateAttribute): Promise<AttributeApi> {
    try {
      const newAttribute = new AttributeSchema({
        ruleset: [data.ruleset],
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
      { new: true }
    );

    if (!updatedAttribute) {
      throw new NotFoundError(`No attribute found with id: ${id}`);
    }

    return this.formatAttribute(updatedAttribute);
  }

  async addSystem(attributeId: string, systemId: string): Promise<AttributeApi> {
    try {
      const attribute = await AttributeSchema.findByIdAndUpdate(
        attributeId,
        { $addToSet: { ruleset: systemId } },
        { new: true }
      );

      if (!attribute) {
        throw new NotFoundError(`No attribute found with id: ${attributeId}`);
      }

      return this.formatAttribute(attribute);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`An attribute with this key already exists in system '${systemId}'`);
      }
      throw error;
    }
  }

  async removeSystem(attributeId: string, systemId: string): Promise<AttributeApi> {
    const attribute = await AttributeSchema.findByIdAndUpdate(
      attributeId,
      { $pull: { ruleset: systemId } },
      { new: true }
    );

    if (!attribute) {
      throw new NotFoundError(`No attribute found with id: ${attributeId}`);
    }

    if (!attribute.ruleset || attribute.ruleset.length === 0) {
      await AttributeSchema.findByIdAndDelete(attributeId);
    }

    return this.formatAttribute(attribute);
  }

  async getBySystems(rulesets: string[]): Promise<AttributeApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const attributes = await AttributeSchema.find({ ruleset: { $in: expandedRulesets } });
    return attributes.map(a => this.formatAttribute(a));
  }

  async formatAbilityBonuses(
    bonuses: AttributeBonusCreate[],
    system: string
  ): Promise<AttributeBonus[]> {
    if (!bonuses || bonuses.length === 0) return [];

    const attributes = await this.getBySystems([system]);
    const attributesMap = new Map<string, AttributeApi>();
    attributes.forEach(a => {
      attributesMap.set(a.key, a);
    });

    return bonuses.map(b => {
      const key = b.key || '';
      const attr = attributesMap.get(key);
      return {
        key,
        name: attr?.name || key,
        bonus: b.bonus,
        icon: attr?.icon
      };
    });
  }

  async formatAbilityBonusChoices(
    bonus_choices: ChoiceMongo | undefined,
    system: string
  ): Promise<ChoiceApi<AttributeBonus> | undefined> {
    if (!bonus_choices) return undefined;

    if (Array.isArray(bonus_choices.options)) {
      const attributes = await this.getBySystems([system]);
      const attributesMap = new Map<string, string>();
      attributes.forEach(a => {
        attributesMap.set(a.key, a.name);
      });

      const options = bonus_choices.options.map(option => {
        return {
          key: option,
          name: attributesMap.get(option) ?? option,
          bonus: 1
        }
      });

      return {
        choose: bonus_choices.choose,
        options
      };
    }

    return undefined;
  }



  private formatAttribute(attribute: AttributeMongo): AttributeApi {
    return {
      id: attribute._id.toString(),
      ruleset: attribute.ruleset || [],
      name: attribute.name,
      description: attribute.description,
      key: attribute.key,
      abbreviation: attribute.abbreviation,
      icon: attribute.icon
    };
  }
}
