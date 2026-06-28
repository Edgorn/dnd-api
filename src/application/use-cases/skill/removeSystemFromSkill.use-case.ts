import SkillService from "../../../domain/services/skill.service";
import { SkillApi } from "../../../domain/types/skill.types";

export default class RemoveSystemFromSkill {
  constructor(private readonly skillService: SkillService) { }

  execute(skillId: string, systemId: string): Promise<SkillApi> {
    return this.skillService.removeSystem(skillId, systemId);
  }
}
