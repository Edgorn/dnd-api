import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import { TraitApi } from "../../../domain/types/traits.types";

export default class GetTraitsBySystemsUseCase {
  constructor(
    private readonly traitService: TraitService,
    private readonly systemService: SystemService
  ) { }

  async execute(ruleset: string[]): Promise<TraitApi[]> {
    const expandedRulesets = await this.systemService.getSystemsAndAncestors(ruleset);
    return this.traitService.getBySystems(expandedRulesets);
  }
}
