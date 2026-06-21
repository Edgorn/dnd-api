import AttributeService from "../../../domain/services/attribute.service";
import { AttributeApi } from "../../../domain/types/attribute.types";

export default class AddAttributeToSystem {
  constructor(private readonly attributeService: AttributeService) { }

  execute(attributeId: string, systemId: string): Promise<AttributeApi> {
    return this.attributeService.addSystem(attributeId, systemId);
  }
}
