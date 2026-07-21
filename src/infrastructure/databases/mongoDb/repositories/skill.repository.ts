import ISkillRepository from "../../../../domain/repositories/ISkillRepository";
import { SkillApi, SkillMongo, SkillPersonajeApi, InputCreateSkill, InputUpdateSkill } from "../../../../domain/types/skill.types";
import { ChoiceMongo, ChoiceApi } from "../../../../domain/types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import SkillSchema from "../schemas/Skill";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { CharacterAttributeApi } from "../../../../domain/types/attribute.types";
import { evaluateFormula } from "../../../../utils/formulaEvaluator";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";

export default class SkillRepository implements ISkillRepository {
  constructor(
    private readonly systemRepository: ISystemRepository
  ) { }

  async create(data: InputCreateSkill): Promise<SkillApi> {
    try {
      const newSkill = new SkillSchema({
        ruleset: data.ruleset,
        name: data.name,
        description: data.description,
        key: data.key,
        bonusFormula: data.bonusFormula,
        attributeScore: data.attributeScore
      });

      await newSkill.save();
      return this.formatSkill(newSkill);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A skill with key '${data.key}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateSkill): Promise<SkillApi> {
    const { id, ...updateFields } = data;
    const updatedSkill = await SkillSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedSkill) {
      throw new NotFoundError(`No skill found with id: ${id}`);
    }

    return this.formatSkill(updatedSkill);
  }

  async getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<SkillApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const rulesetQuery: any = { ruleset: { $in: expandedRulesets } };
    if (!includeDeleted) {
      rulesetQuery.deletedAt = null;
    }
    const skills = await SkillSchema.find(rulesetQuery).lean<SkillMongo[]>();
    return skills.map(s => this.formatSkill(s));
  }

  async getSkillsByKeys(keys: string[]): Promise<SkillApi[]> {
    if (!keys.length) return [];
    const skills = await SkillSchema.find({ key: { $in: keys }, deletedAt: null }).lean<SkillMongo[]>();
    return ordenarPorNombre(this.formatSkills(skills));
  }

  async getAll(): Promise<SkillApi[]> {
    const skills = await SkillSchema.find({ deletedAt: null }).lean<SkillMongo[]>();
    return ordenarPorNombre(this.formatSkills(skills));
  }



  private formatSkills(skills: SkillMongo[]): SkillApi[] {
    return skills.map(skill => this.formatSkill(skill));
  }

  private formatSkill(skill: SkillMongo): SkillApi {
    return {
      id: skill._id.toString(),
      ruleset: skill.ruleset || '',
      name: skill.name,
      description: skill.description,
      key: skill.key,
      bonusFormula: skill.bonusFormula,
      attributeScore: skill.attributeScore || [],
      deletedAt: skill.deletedAt
    };
  }

  async getById(id: string): Promise<SkillApi | null> {
    const skill = await SkillSchema.findById(id).lean<SkillMongo>();
    if (!skill) return null;
    return this.formatSkill(skill);
  }

  async softDelete(id: string): Promise<void> {
    await SkillSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await SkillSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await SkillSchema.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await SkillSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }
}
