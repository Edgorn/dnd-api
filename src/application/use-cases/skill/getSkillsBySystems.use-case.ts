import SkillService from "../../../domain/services/skill.service";
import { SkillApi } from "../../../domain/types/skill.types";

export default class GetSkillsBySystems {
  constructor(private readonly skillService: SkillService) { }

  execute(): Promise<SkillApi[]> {
    return this.skillService.getAll();
  }
}
