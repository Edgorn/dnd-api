import ISkillRepository from "../repositories/ISkillRepository";
import { SkillApi, SkillPersonajeApi, InputCreateSkill, InputUpdateSkill } from "../types/skill.types";
import { ChoiceMongo, ChoiceApi } from "../types";
import { CharacterAttributeApi } from "../types/attribute.types";
import { evaluateFormula } from "../../utils/formulaEvaluator";

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

  getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<SkillApi[]> {
    return this.skillRepository.getBySystems(rulesets, includeDeleted);
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

  async getCharacterSkills(
    skillsKeys: string[],
    doubleSkillsKeys: string[],
    attributes: CharacterAttributeApi[],
    profBonus: number,
    hasJackOfAllTrades: boolean
  ): Promise<SkillPersonajeApi[]> {
    const allSkills = await this.skillRepository.getAll();

    return allSkills.map(skill => {
      let value = doubleSkillsKeys?.includes(skill.key)
        ? 2
        : skillsKeys?.includes(skill.key)
          ? 1
          : 0;

      if (hasJackOfAllTrades && value === 0) {
        value = 0.5;
      }

      let modifier = 0;
      const formula = skill.bonusFormula || '';
      if (formula) {
        const profBonusVal = value * profBonus;
        modifier = evaluateFormula(formula, attributes, {
          proficiencyBonus: profBonusVal
        });
      } else {
        const primaryAttrKey = skill.attributeScore?.[0];
        const primaryAttr = attributes.find(a => a.key === primaryAttrKey);
        const attrMod = primaryAttr?.modifier ?? 0;
        modifier = attrMod + value * profBonus;
      }

      return {
        id: skill.id,
        name: skill.name,
        description: skill.description,
        key: skill.key,
        attributeScore: skill.attributeScore || [],
        value,
        modifier
      };
    });
  }

  async formatSkillChoices(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<SkillApi> | undefined> {
    if (!opciones) return undefined;

    if (opciones.options && opciones.options.length > 0) {
      const skills = await this.skillRepository.getSkillsByKeys(opciones.options);

      return {
        choose: opciones.choose,
        options: skills
      };
    }

    if (typeof opciones.options === 'string' && opciones.options === 'all') {
      const skills = await this.getAll();

      return {
        choose: opciones.choose,
        options: skills
      };
    }

    if (opciones.filter) {
      const skills = await this.getAll();
      const filteredSkills = skills.filter(skill => {
        for (const [key, value] of Object.entries(opciones.filter!)) {
          const skillVal = (skill as any)[key];
          if (Array.isArray(value)) {
            if (!value.includes(skillVal)) return false;
          } else if (skillVal !== value) {
            return false;
          }
        }
        return true;
      });

      return {
        choose: opciones.choose,
        options: filteredSkills
      };
    }

    if ((!opciones.options || opciones.options.length === 0) && !opciones.filter) {
      const skills = await this.getAll();
      return {
        choose: opciones.choose,
        options: skills
      };
    }

    console.warn("Opciones de skills no reconocidas:", opciones.options);
    return undefined;
  }
}
