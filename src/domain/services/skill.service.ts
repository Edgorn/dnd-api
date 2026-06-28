import ISkillRepository from "../repositories/ISkillRepository";
import { SkillApi, InputCreateSkill, InputUpdateSkill } from "../types/skill.types";

export default class SkillService {
  constructor(private readonly skillRepository: ISkillRepository) { }

  create(data: InputCreateSkill): Promise<SkillApi> {
    return this.skillRepository.create(data);
  }

  update(data: InputUpdateSkill): Promise<SkillApi> {
    return this.skillRepository.update(data);
  }

  addSystem(skillId: string, systemId: string): Promise<SkillApi> {
    return this.skillRepository.addSystem(skillId, systemId);
  }

  removeSystem(skillId: string, systemId: string): Promise<SkillApi> {
    return this.skillRepository.removeSystem(skillId, systemId);
  }

  getAll(): Promise<SkillApi[]> {
    return this.skillRepository.getAll();
  }
}
