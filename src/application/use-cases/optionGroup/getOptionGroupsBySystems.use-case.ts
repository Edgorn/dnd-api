import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { OptionGroupApi } from "../../../domain/types/optionGroup.types";
import { loadResolvedCatalogs } from "../shared/resolveInheritedCatalog";

export default class GetOptionGroupsBySystems {
  constructor(
    private readonly optionGroupService: OptionGroupService,
    private readonly systemService: SystemService
  ) {}

  async execute(systems?: string[]): Promise<Omit<OptionGroupApi, "deletedAt">[]> {
    const rulesets = systems ?? [];
    if (rulesets.length === 0) {
      const groups = await this.optionGroupService.getBySystems(rulesets);
      return groups.map(({ deletedAt: _deletedAt, ...rest }) => rest);
    }

    const groups = await loadResolvedCatalogs(
      rulesets,
      (id) => this.systemService.getAncestry(id),
      (keys) => this.optionGroupService.getBySystems(keys, false),
      {
        identityOf: (item) => item.name,
        rulesetOf: (item) => item.ruleset
      }
    );
    return groups.map(({ deletedAt: _deletedAt, ...rest }) => rest);
  }
}
