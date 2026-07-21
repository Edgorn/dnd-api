import AttributeService from "../../../domain/services/attribute.service";
import { AttributeApiPublic } from "../../../domain/types/attribute.types";

export default class GetAttributesBySystems {
  constructor(private readonly attributeService: AttributeService) { }

  async execute(systems?: string[]): Promise<AttributeApiPublic[]> {
    const rulesets = systems ?? [];
    const attributes = await this.attributeService.getBySystems(rulesets);
    return attributes.map(({ deletedAt, ...rest }) => rest);
  }
}
