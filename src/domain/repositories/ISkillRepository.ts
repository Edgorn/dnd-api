import { ChoiceMongo, ChoiceApi } from "../types";
import { SkillApi, SkillPersonajeApi, InputCreateSkill, InputUpdateSkill } from "../types/skill.types";
import { CharacterAttributeApi } from "../types/attribute.types";

export default interface ISkillRepository {
  create(data: InputCreateSkill): Promise<SkillApi>;
  update(data: InputUpdateSkill): Promise<SkillApi>;
  addSystem(skillId: string, systemId: string): Promise<SkillApi>;
  removeSystem(skillId: string, systemId: string): Promise<SkillApi>;
  
  getBySystems(rulesets: string[]): Promise<SkillApi[]>;
  getSkillsByKeys(keys: string[]): Promise<SkillApi[]>;
  getAll(): Promise<SkillApi[]>;
  getCharacterSkills(
    skills: string[], 
    double_skills: string[],
    attributes: CharacterAttributeApi[],
    profBonus: number,
    hasJackOfAllTrades: boolean
  ): Promise<SkillPersonajeApi[]>;
  formatSkillChoices(options: ChoiceMongo | undefined): Promise<ChoiceApi<SkillApi> | undefined>;
}
