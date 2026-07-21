import SkillService from "../../../domain/services/skill.service";
import { SkillApiPublic } from "../../../domain/types/skill.types";

export default class GetSkillsBySystems {
  constructor(
    private readonly skillService: SkillService
  ) { }

  async execute(systems?: string[]): Promise<SkillApiPublic[]> {
    if (!systems || systems.length === 0) {
      const skills = await this.skillService.getAll();
      return skills.map(({ deletedAt, ...rest }) => rest);
    }
    const skills = await this.skillService.getBySystems(systems);
    return skills.map(({ deletedAt, ...rest }) => rest);
  }
}
