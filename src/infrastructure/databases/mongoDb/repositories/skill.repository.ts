import ISkillRepository from "../../../../domain/repositories/ISkillRepository";
import { SkillApi, SkillMongo, SkillPersonajeApi, InputCreateSkill, InputUpdateSkill } from "../../../../domain/types/skill.types";
import { ChoiceMongo, ChoiceApi } from "../../../../domain/types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import SkillSchema from "../schemas/Skill";
import { NotFoundError } from "../../../../domain/errors/AppError";
import { CharacterAttributeApi } from "../../../../domain/types/attribute.types";
import { evaluateFormula } from "../../../../utils/formulaEvaluator";

export default class SkillRepository implements ISkillRepository {
  constructor() {}

  async create(data: InputCreateSkill): Promise<SkillApi> {
    const newSkill = new SkillSchema({
      ruleset: [data.ruleset],
      name: data.name,
      description: data.description,
      key: data.key,
      bonusFormula: data.bonusFormula,
      attributeScore: data.attributeScore
    });

    await newSkill.save();
    return this.formatSkill(newSkill);
  }

  async update(data: InputUpdateSkill): Promise<SkillApi> {
    const { id, ...updateFields } = data;
    const updatedSkill = await SkillSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedSkill) {
      throw new NotFoundError(`No skill found with id: ${id}`);
    }

    return this.formatSkill(updatedSkill);
  }

  async addSystem(skillId: string, systemId: string): Promise<SkillApi> {
    const skill = await SkillSchema.findByIdAndUpdate(
      skillId,
      { $addToSet: { ruleset: systemId } },
      { new: true }
    );

    if (!skill) {
      throw new NotFoundError(`No skill found with id: ${skillId}`);
    }

    return this.formatSkill(skill);
  }

  async removeSystem(skillId: string, systemId: string): Promise<SkillApi> {
    const skill = await SkillSchema.findByIdAndUpdate(
      skillId,
      { $pull: { ruleset: systemId } },
      { new: true }
    );

    if (!skill) {
      throw new NotFoundError(`No skill found with id: ${skillId}`);
    }

    if (!skill.ruleset || skill.ruleset.length === 0) {
      await SkillSchema.findByIdAndDelete(skillId);
    }

    return this.formatSkill(skill);
  }

  async getBySystems(rulesets: string[]): Promise<SkillApi[]> {
    const skills = await SkillSchema.find({ ruleset: { $in: rulesets } });
    return skills.map(s => this.formatSkill(s));
  }

  async getSkillsByKeys(keys: string[]): Promise<SkillApi[]> {
    if (!keys.length) return [];
    const skills = await SkillSchema.find({ key: { $in: keys } });
    return ordenarPorNombre(this.formatSkills(skills));
  }

  async getAll(): Promise<SkillApi[]> {
    const skills = await SkillSchema.find();
    return ordenarPorNombre(this.formatSkills(skills));
  }

  async getCharacterSkills(
    skillsKeys: string[], 
    doubleSkillsKeys: string[],
    attributes: CharacterAttributeApi[],
    profBonus: number,
    hasJackOfAllTrades: boolean
  ): Promise<SkillPersonajeApi[]> {
    const allSkills = await SkillSchema.find()
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    const skillsFormateadas = allSkills.map(skill => {
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
        id: skill._id.toString(),
        name: skill.name,
        description: skill.description,
        key: skill.key,
        attributeScore: skill.attributeScore || [],
        value,
        modifier
      };
    });

    return skillsFormateadas;
  }

  async formatSkillChoices(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<SkillApi> | undefined> {
    if (!opciones) return undefined;

    if (Array.isArray(opciones.options)) {
      const skills = await this.getSkillsByKeys(opciones.options);

      return {
        choose: opciones.choose,
        options: skills
      };
    }

    if (opciones.options === 'all') {
      const skills = await this.getAll();

      return {
        choose: opciones.choose,
        options: skills
      };
    }

    console.warn("Opciones de skills no reconocidas:", opciones.options);
    return undefined;
  }

  private formatSkills(skills: SkillMongo[]): SkillApi[] {
    return skills.map(skill => this.formatSkill(skill));
  }

  private formatSkill(skill: SkillMongo): SkillApi {
    return {
      id: skill._id.toString(),
      ruleset: skill.ruleset || [],
      name: skill.name,
      description: skill.description,
      key: skill.key,
      bonusFormula: skill.bonusFormula,
      attributeScore: skill.attributeScore || []
    };
  }
}
