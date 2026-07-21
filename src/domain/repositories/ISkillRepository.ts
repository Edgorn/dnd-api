import { SkillApi, InputCreateSkill, InputUpdateSkill } from "../types/skill.types";

export default interface ISkillRepository {
  create(data: InputCreateSkill): Promise<SkillApi>;
  update(data: InputUpdateSkill): Promise<SkillApi>;
  getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<SkillApi[]>;
  getSkillsByKeys(keys: string[]): Promise<SkillApi[]>;
  getAll(): Promise<SkillApi[]>;
  getById(id: string): Promise<SkillApi | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
