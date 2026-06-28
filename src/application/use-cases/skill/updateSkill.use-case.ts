import SkillService from "../../../domain/services/skill.service";
import { SkillApi, InputUpdateSkill } from "../../../domain/types/skill.types";

export default class UpdateSkill {
  constructor(private readonly skillService: SkillService) { }

  execute(data: InputUpdateSkill): Promise<SkillApi> {
    return this.skillService.update(data);
  }
}
