import IAttributeRepository from "../repositories/IAttributeRepository";
import ISystemRepository from "../repositories/ISystemRepository";
import { AttributeApi, AttributeBonus, AttributeBonusCreate, CharacterAttributeApi, InputCreateAttribute, InputUpdateAttribute } from "../types/attribute.types";
import { ChoiceApi, ChoiceMongo } from "../types";
import { evaluateAttributeModifier } from "../../utils/formulaEvaluator";

export default class AttributeService {
  constructor(
    private readonly attributeRepository: IAttributeRepository,
    private readonly systemRepository?: ISystemRepository
  ) { }

  create(data: InputCreateAttribute): Promise<AttributeApi> {
    return this.attributeRepository.create(data);
  }

  update(data: InputUpdateAttribute): Promise<AttributeApi> {
    return this.attributeRepository.update(data);
  }

  getBySystems(rulesets: string[]): Promise<AttributeApi[]> {
    return this.attributeRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<AttributeApi | null> {
    return this.attributeRepository.getById(id);
  }

  softDelete(id: string): Promise<void> {
    return this.attributeRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.attributeRepository.restore(id);
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

    if (bonus_choices.options && bonus_choices.options.length > 0) {
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
        };
      });

      return {
        choose: bonus_choices.choose,
        options
      };
    }

    if (bonus_choices.filter) {
      const attributes = await this.getBySystems([system]);
      const attributesMap = new Map<string, string>();
      attributes.forEach(a => {
        attributesMap.set(a.key, a.name);
      });

      const options = attributes.map(a => {
        return {
          key: a.key,
          name: a.name,
          bonus: 1
        };
      });

      return {
        choose: bonus_choices.choose,
        options
      };
    }

    if (!bonus_choices.options && !bonus_choices.filter) {
      const attributes = await this.getBySystems([system]);
      const options = attributes.map(a => {
        return {
          key: a.key,
          name: a.name,
          bonus: 1
        };
      });
      return { choose: bonus_choices.choose, options };
    }

    return undefined;
  }

  async formatAttributes(attributes: { key: string, value: number }[], systems: string[]): Promise<CharacterAttributeApi[]> {
    const charAttributes = await this.getBySystems(systems);
    const globalModifierFormula = this.systemRepository
      ? await this.systemRepository.getGlobalModifierFormula(systems)
      : undefined;

    return charAttributes.map(c => {
      const dbAttr = attributes.find(a => a.key === c.key);
      const value = dbAttr ? dbAttr.value : 10;

      const modifier = globalModifierFormula
        ? evaluateAttributeModifier(globalModifierFormula, value)
        : undefined;

      return {
        id: c.id,
        ruleset: c.ruleset,
        name: c.name,
        description: c.description,
        key: c.key,
        abbreviation: c.abbreviation,
        value: value,
        modifier: modifier,
        icon: c.icon
      };
    });
  }
}
