import ISkillRepository from "../repositories/ISkillRepository";
import { SkillApi, SkillSheetApi, InputCreateSkill, InputUpdateSkill } from "../types/skill.types";
import { ChoiceMongo, ChoiceApi } from "../types";
import { CharacterAttributeApi } from "../types/attribute.types";
import { evaluateFormula } from "../../utils/formulaEvaluator";
import { maxSkillProficiencyValue } from "../../utils/applyTraitSkillProficiencies";

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

  getBySystems(
    rulesets: string[],
    includeDeleted: boolean = false,
    expandAncestry: boolean = true
  ): Promise<SkillApi[]> {
    return this.skillRepository.getBySystems(rulesets, includeDeleted, expandAncestry);
  }

  getById(id: string): Promise<SkillApi | null> {
    return this.skillRepository.getById(id);
  }

  getSkillsByIds(ids: string[]): Promise<SkillApi[]> {
    if (!ids.length) return Promise.resolve([]);
    return this.skillRepository.getSkillsByIds(ids);
  }

  softDelete(id: string): Promise<void> {
    return this.skillRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.skillRepository.restore(id);
  }

  async getCharacterSkills(
    skillsKeys: string[],
    attributes: CharacterAttributeApi[],
    profBonus: number,
    skillProficiencies: Array<{ value: number; skillIds?: string[]; attributeKeys?: string[] }> = [],
    options?: { omitDescription?: boolean }
  ): Promise<SkillSheetApi[]> {
    const allSkills = await this.skillRepository.getAll();

    return allSkills.map(skill => {
      const baseValue = (skillsKeys?.includes(skill.id) || skillsKeys?.includes(skill.key))
        ? 1
        : 0;

      const value = maxSkillProficiencyValue(baseValue, skill, skillProficiencies);
      const proficiencyContribution = Math.floor(value * profBonus);

      let modifier = 0;
      const formula = skill.bonusFormula || '';
      if (formula) {
        modifier = evaluateFormula(formula, attributes, {
          proficiencyBonus: proficiencyContribution
        });
      } else {
        const primaryAttrKey = skill.attributeScore?.[0];
        const primaryAttr = attributes.find(a => a.key === primaryAttrKey);
        const attrMod = primaryAttr?.modifier ?? 0;
        modifier = attrMod + proficiencyContribution;
      }

      return {
        id: skill.id,
        name: skill.name,
        ...(options?.omitDescription ? {} : { description: skill.description }),
        key: skill.key,
        attributeScore: skill.attributeScore || [],
        value,
        modifier
      };
    });
  }

  async formatSkillChoices(
    opciones: ChoiceMongo | undefined,
    ruleset?: string
  ): Promise<ChoiceApi<SkillApi> | undefined> {
    if (!opciones || typeof opciones.choose !== "number" || opciones.choose < 1) {
      return undefined;
    }

    const options = opciones.options as string[] | string | undefined;
    const loadCatalog = () => ruleset ? this.getBySystems([ruleset]) : this.getAll();

    // Soporte legacy para base de datos (cuando options era un string)
    if (typeof options === 'string') {
      const isAll = options === 'all' || options === 'cualquiera';
      const skills = isAll
        ? await loadCatalog()
        : await this.skillRepository.getSkillsByIndices([options]);

      return {
        choose: opciones.choose,
        options: skills,
        query_type: isAll ? "all" : "options"
      };
    }

    if (Array.isArray(options) && options.length > 0) {
      const skills = await this.skillRepository.getSkillsByIndices(options);

      return {
        choose: opciones.choose,
        options: skills,
        query_type: "options"
      };
    }

    if (opciones.filter) {
      const skills = await loadCatalog();
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
        options: filteredSkills,
        query_type: "filter",
        query_filter: opciones.filter
      };
    }

    if ((!options || options.length === 0) && !opciones.filter) {
      const skills = await loadCatalog();
      return {
        choose: opciones.choose,
        options: skills,
        query_type: "all"
      };
    }

    console.warn("Opciones de skills no reconocidas:", options);
    return undefined;
  }
}
