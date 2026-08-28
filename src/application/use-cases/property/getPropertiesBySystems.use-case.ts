import PropertyService from "../../../domain/services/property.service";
import { Property } from "../../../domain/types/property.types";

export default class GetPropertiesBySystems {
  constructor(private readonly propertyService: PropertyService) {}

  async execute(systems?: string[]): Promise<Omit<Property, "deletedAt">[]> {
    const rulesets = systems ?? [];
    const properties = await this.propertyService.getBySystems(rulesets);
    return properties.map(({ deletedAt, ...rest }) => rest);
  }
}
