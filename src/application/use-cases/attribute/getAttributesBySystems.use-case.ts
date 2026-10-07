import AttributeService from "../../../domain/services/attribute.service";
import SystemService from "../../../domain/services/system.service";
import { AttributeApiPublic } from "../../../domain/types/attribute.types";
import { loadResolvedCatalogs } from "../shared/resolveInheritedCatalog";

export default class GetAttributesBySystems {
  constructor(
    private readonly attributeService: AttributeService,
    private readonly systemService: SystemService
  ) { }

  async execute(systems?: string[]): Promise<AttributeApiPublic[]> {
    const rulesets = systems ?? [];
    if (rulesets.length === 0) {
      const attributes = await this.attributeService.getBySystems(rulesets);
      return attributes.map(({ deletedAt, ...rest }) => rest);
    }

    const attributes = await loadResolvedCatalogs(
      rulesets,
      (id) => this.systemService.getAncestry(id),
      (keys) => this.attributeService.getBySystems(keys, false),
      {
        identityOf: (item) => item.key,
        rulesetOf: (item) => item.ruleset,
      }
    );
    return attributes.map(({ deletedAt, ...rest }) => rest);
  }
}
