import AttributeService from "../../../domain/services/attribute.service";
import { AttributeApi } from "../../../domain/types/attribute.types";

export default class RemoveAttributeFromSystem {
  constructor(private readonly attributeService: AttributeService) { }

  execute(attributeId: string, systemId: string): Promise<AttributeApi> {
    return this.attributeService.removeSystem(attributeId, systemId);
  }
}
