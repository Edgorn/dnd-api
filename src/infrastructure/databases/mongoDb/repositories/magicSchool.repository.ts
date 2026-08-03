import IMagicSchoolRepository from "../../../../domain/repositories/IMagicSchoolRepository";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";
import { MagicSchoolApi, InputCreateMagicSchool, InputUpdateMagicSchool, MagicSchoolMongo } from "../../../../domain/types/magicSchool.types";
import MagicSchoolSchema from "../schemas/MagicSchool";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";

export default class MagicSchoolRepository implements IMagicSchoolRepository {
  constructor(
    private readonly systemRepository: ISystemRepository
  ) {}

  async create(data: InputCreateMagicSchool): Promise<MagicSchoolApi> {
    try {
      const newMagicSchool = new MagicSchoolSchema({
        ruleset: data.ruleset,
        name: data.name,
        description: data.description,
        color: data.color
      });

      await newMagicSchool.save();
      return this.formatMagicSchool(newMagicSchool);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A magic school with name '${data.name}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateMagicSchool): Promise<MagicSchoolApi> {
    const { id, ...updateFields } = data;
    const updatedMagicSchool = await MagicSchoolSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedMagicSchool) {
      throw new NotFoundError(`No magic school found with id: ${id}`);
    }

    return this.formatMagicSchool(updatedMagicSchool);
  }

  async getBySystems(rulesets: string[]): Promise<MagicSchoolApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const magicSchools = await MagicSchoolSchema.find({ ruleset: { $in: expandedRulesets }, deletedAt: null });
    return magicSchools.map(m => this.formatMagicSchool(m));
  }

  async getById(id: string): Promise<MagicSchoolApi | null> {
    const magicSchool = await MagicSchoolSchema.findById(id).lean<MagicSchoolMongo>();
    if (!magicSchool) return null;
    return this.formatMagicSchool(magicSchool);
  }

  async softDelete(id: string): Promise<void> {
    await MagicSchoolSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await MagicSchoolSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await MagicSchoolSchema.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await MagicSchoolSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private formatMagicSchool(magicSchool: MagicSchoolMongo): MagicSchoolApi {
    return {
      id: magicSchool._id.toString(),
      ruleset: magicSchool.ruleset || '',
      name: magicSchool.name,
      description: magicSchool.description,
      color: magicSchool.color,
      deletedAt: magicSchool.deletedAt
    };
  }
}
