import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { CharacterClassCatalogItem } from "../../../domain/types/characterClass.types";
import { filterExcludedById } from "../../../utils/catalogExclusions";

export default class GetCharacterClassCatalog {
  constructor(
    private readonly characterClassService: CharacterClassService,
    private readonly systemService: SystemService
  ) { }

  async execute(rulesets?: string[], includeMulticlass: boolean = false): Promise<CharacterClassCatalogItem[]> {
    if (!rulesets || rulesets.length === 0) {
      return [];
    }
    const catalog = await this.characterClassService.getCatalog(rulesets, includeMulticlass);
    const exclusions = await this.systemService.getResolvedCatalogExclusions(rulesets);
    return filterExcludedById(catalog, exclusions.classIds);
  }
}
