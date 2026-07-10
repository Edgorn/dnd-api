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

  // Mongoose models allow us to use AttributeModel.findById but since we only have repository methods, we can just add a getById if it exists. Wait, I don't have getById in IAttributeRepository!
  // I will just add an ad-hoc check in the repository or just fetch the list of attributes for the system.
  // Actually, wait, it's easier to add getById in the repository.



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
