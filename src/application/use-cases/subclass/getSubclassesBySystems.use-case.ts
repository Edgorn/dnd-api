import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import { SubclassApi } from "../../../domain/types/subclass.types";
import { filterSubclassesByExcludedClasses } from "../../../utils/catalogExclusions";

export default class GetSubclassesBySystems {
  constructor(
    private readonly subclassService: SubclassService,
    private readonly systemService: SystemService
  ) { }

  async execute(rulesets: string[], classId?: string): Promise<SubclassApi[]> {
    if (!rulesets.length) {
      return [];
    }
    const subclasses = await this.subclassService.getBySystems(rulesets, classId);
    const exclusions = await this.systemService.getResolvedCatalogExclusions(rulesets);
    return filterSubclassesByExcludedClasses(subclasses, exclusions.classIds);
  }
}
