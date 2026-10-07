import SkillService from "../../../domain/services/skill.service";
import SystemService from "../../../domain/services/system.service";
import { SkillApiPublic } from "../../../domain/types/skill.types";
import { loadResolvedCatalogs } from "../shared/resolveInheritedCatalog";

export default class GetSkillsBySystems {
  constructor(
    private readonly skillService: SkillService,
    private readonly systemService: SystemService
  ) { }

  async execute(systems?: string[]): Promise<SkillApiPublic[]> {
    if (!systems || systems.length === 0) {
      const skills = await this.skillService.getAll();
      return skills.map(({ deletedAt, ...rest }) => rest);
    }

    const skills = await loadResolvedCatalogs(
      systems,
      (id) => this.systemService.getAncestry(id),
      (keys) => this.skillService.getBySystems(keys, false, false),
      {
        identityOf: (item) => item.key,
        rulesetOf: (item) => item.ruleset,
      }
    );
    return skills.map(({ deletedAt, ...rest }) => rest);
  }
}
