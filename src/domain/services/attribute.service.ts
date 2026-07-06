import IAttributeRepository from "../repositories/IAttributeRepository";
import ISystemRepository from "../repositories/ISystemRepository";
import { AttributeApi, CharacterAttributeApi, InputCreateAttribute, InputUpdateAttribute } from "../types/attribute.types";
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

  addSystem(attributeId: string, systemId: string): Promise<AttributeApi> {
    return this.attributeRepository.addSystem(attributeId, systemId);
  }

  removeSystem(attributeId: string, systemId: string): Promise<AttributeApi> {
    return this.attributeRepository.removeSystem(attributeId, systemId);
  }

  getBySystems(rulesets: string[]): Promise<AttributeApi[]> {
    return this.attributeRepository.getBySystems(rulesets);
  }

  async formatAttributes(attributes: { key: string, value: number }[], systems: string[]): Promise<CharacterAttributeApi[]> {
    const charAttributes = await this.getBySystems(systems);
    const globalModifierFormula = this.systemRepository
      ? await this.systemRepository.obtenerFormulaModificadorGlobal(systems)
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
