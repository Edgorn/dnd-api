import SkillService from "../../../domain/services/skill.service";
import { SkillApi, InputCreateSkill } from "../../../domain/types/skill.types";

export default class CreateSkill {
  constructor(private readonly skillService: SkillService) { }

  execute(data: InputCreateSkill): Promise<SkillApi> {
    return this.skillService.create(data);
  }
}
