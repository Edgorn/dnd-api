import { Types } from "mongoose";
import IGroupOptionRepository from "../../../../domain/repositories/IGroupOptionRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import ITraitRepository from "../../../../domain/repositories/ITraitRepository";
import { NotFoundError } from "../../../../domain/errors/AppError";
import {
  GroupOptionApi,
  GroupOptionMongo,
  InputCreateGroupOption,
  InputUpdateGroupOption
} from "../../../../domain/types/optionGroup.types";
import GroupOptionSchema from "../schemas/GroupOption";

export default class GroupOptionRepository implements IGroupOptionRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly traitRepository: ITraitRepository
  ) {}

  async create(data: InputCreateGroupOption): Promise<GroupOptionApi> {
    const created = new GroupOptionSchema({
      ruleset: data.ruleset,
      groupId: data.groupId,
      traitId: data.traitId,
      prerequisites: data.prerequisites,
      repeatable: data.repeatable ?? false
    });
    await created.save();
    return this.format(created);
  }

  async update(data: InputUpdateGroupOption): Promise<GroupOptionApi> {
    const { id, ...updateFields } = data;
    const setFields: Record<string, unknown> = {};
    if (updateFields.groupId !== undefined) setFields.groupId = updateFields.groupId;
    if (updateFields.traitId !== undefined) setFields.traitId = updateFields.traitId;
    if (updateFields.prerequisites !== undefined) setFields.prerequisites = updateFields.prerequisites;
    if (updateFields.repeatable !== undefined) setFields.repeatable = updateFields.repeatable;

    const updated = await GroupOptionSchema.findByIdAndUpdate(
      id,
      { $set: setFields },
      { returnDocument: "after" }
    );

    if (!updated) {
      throw new NotFoundError("Opción de grupo no encontrada");
    }

    return this.format(updated);
  }

  async getByGroup(groupId: string, rulesets: string[], expandAncestry: boolean = true): Promise<GroupOptionApi[]> {
    const expandedRulesets = expandAncestry
      ? await this.systemRepository.getSystemsAndAncestors(rulesets)
      : rulesets;
    const docs = await GroupOptionSchema.find({
      groupId,
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    }).lean<GroupOptionMongo[]>();
    return this.formatMany(docs);
  }

  async getBySystems(rulesets: string[], expandAncestry: boolean = true): Promise<GroupOptionApi[]> {
    const expandedRulesets = expandAncestry
      ? await this.systemRepository.getSystemsAndAncestors(rulesets)
      : rulesets;
    const docs = await GroupOptionSchema.find({
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    }).lean<GroupOptionMongo[]>();
    return this.formatMany(docs);
  }

  async getByGroupIds(
    groupIds: string[],
    rulesets: string[],
    expandAncestry: boolean = true
  ): Promise<GroupOptionApi[]> {
    const uniqueGroupIds = [...new Set(groupIds.filter(Boolean))];
    if (!uniqueGroupIds.length) return [];

    const expandedRulesets = expandAncestry
      ? await this.systemRepository.getSystemsAndAncestors(rulesets)
      : rulesets;
    const docs = await GroupOptionSchema.find({
      groupId: { $in: uniqueGroupIds },
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    }).lean<GroupOptionMongo[]>();
    return this.formatMany(docs);
  }

  async getByIds(ids: string[]): Promise<GroupOptionApi[]> {
    const validIds = [...new Set(ids.filter(id => Types.ObjectId.isValid(id)))];
    if (!validIds.length) return [];

    const docs = await GroupOptionSchema.find({
      _id: { $in: validIds },
      deletedAt: null
    }).lean<GroupOptionMongo[]>();

    return this.formatMany(docs);
  }

  async getById(id: string): Promise<GroupOptionApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await GroupOptionSchema.findById(id).lean<GroupOptionMongo>();
    if (!doc) return null;
    const [formatted] = await this.formatMany([doc]);
    return formatted ?? null;
  }

  async softDelete(id: string): Promise<void> {
    await GroupOptionSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await GroupOptionSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await GroupOptionSchema.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await GroupOptionSchema.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private async formatMany(docs: GroupOptionMongo[]): Promise<GroupOptionApi[]> {
    const traitIds = [...new Set(docs.map(doc => doc.traitId).filter(Boolean))];
    const traits = traitIds.length
      ? await this.traitRepository.getTraitsByIndexes(traitIds)
      : [];
    const traitsById = new Map(traits.map(trait => [trait.id, trait]));

    return docs.map(doc => ({
      id: doc._id.toString(),
      ruleset: doc.ruleset,
      groupId: doc.groupId,
      traitId: doc.traitId,
      trait: traitsById.get(doc.traitId),
      prerequisites: doc.prerequisites ?? null,
      repeatable: Boolean(doc.repeatable),
      deletedAt: doc.deletedAt ?? null
    }));
  }

  private async format(doc: GroupOptionMongo): Promise<GroupOptionApi> {
    const [formatted] = await this.formatMany([doc]);
    return formatted;
  }
}
