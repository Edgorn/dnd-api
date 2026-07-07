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



  getAll(): Promise<SkillApi[]> {
    return this.skillRepository.getAll();
  }

  getBySystems(rulesets: string[]): Promise<SkillApi[]> {
    return this.skillRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<SkillApi | null> {
    return this.skillRepository.getById(id);
  }

  softDelete(id: string): Promise<void> {
    return this.skillRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.skillRepository.restore(id);
  }
}
