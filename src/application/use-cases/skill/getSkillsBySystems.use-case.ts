import SkillService from "../../../domain/services/skill.service";
import SystemService from "../../../domain/services/system.service";
import { SkillApi } from "../../../domain/types/skill.types";

export default class GetSkillsBySystems {
  constructor(
    private readonly skillService: SkillService,
    private readonly systemService: SystemService
  ) { }

  async execute(systems?: string[]): Promise<SkillApi[]> {
    if (!systems || systems.length === 0) {
      return this.skillService.getAll();
    }
    const expandedSystems = await this.systemService.getSystemsAndAncestors(systems);
    return this.skillService.getBySystems(expandedSystems);
  }
}
