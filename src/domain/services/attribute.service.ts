import IAttributeRepository from "../repositories/IAttributeRepository";
import { AttributeApi, InputCreateAttribute, InputUpdateAttribute } from "../types/attribute.types";

export default class AttributeService {
  constructor(private readonly attributeRepository: IAttributeRepository) { }

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
}
