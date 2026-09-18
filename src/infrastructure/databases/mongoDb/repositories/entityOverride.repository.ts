import IEntityOverrideRepository from "../../../../domain/repositories/IEntityOverrideRepository";
import {
  EntityOverrideApi,
  EntityOverrideMongo,
  EntityOverrideType,
  UpsertEntityOverride
} from "../../../../domain/types/entityOverride.types";
import { sanitizeFlavorPatch } from "../../../../utils/applyRaceOverrides";
import EntityOverrideModel from "../schemas/EntityOverride";

export default class EntityOverrideRepository implements IEntityOverrideRepository {
  async upsert(data: UpsertEntityOverride): Promise<EntityOverrideApi> {
    const existing = await EntityOverrideModel.findOne({
      ruleset: data.ruleset,
      entityType: data.entityType,
      sourceId: data.sourceId
    });

    if (existing) {
      existing.patch = data.patch;
      existing.deletedAt = null;
      await existing.save();
      return this.format(existing);
    }

    const created = new EntityOverrideModel({
      ruleset: data.ruleset,
      entityType: data.entityType,
      sourceId: data.sourceId,
      patch: data.patch,
      deletedAt: null
    });
    await created.save();
    return this.format(created);
  }

  async getBySource(
    ruleset: string,
    entityType: EntityOverrideType,
    sourceId: string,
    includeDeleted: boolean = false
  ): Promise<EntityOverrideApi | null> {
    const query: Record<string, unknown> = { ruleset, entityType, sourceId };
    if (!includeDeleted) {
      query.deletedAt = null;
    }

    const doc = await EntityOverrideModel.findOne(query);
    if (!doc) return null;
    if (!includeDeleted && doc.deletedAt) return null;
    return this.format(doc);
  }

  async getBySystems(rulesets: string[], entityType: EntityOverrideType): Promise<EntityOverrideApi[]> {
    if (!rulesets.length) return [];

    const docs = await EntityOverrideModel.find({
      ruleset: { $in: rulesets },
      entityType,
      deletedAt: null
    }).lean<EntityOverrideMongo[]>();

    return docs.map(doc => this.format(doc));
  }

  async softDelete(
    ruleset: string,
    entityType: EntityOverrideType,
    sourceId: string
  ): Promise<boolean> {
    const result = await EntityOverrideModel.findOneAndUpdate(
      { ruleset, entityType, sourceId, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    return !!result;
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await EntityOverrideModel.updateMany(
      { ruleset, deletedAt: null },
      { $set: { deletedAt } }
    );
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await EntityOverrideModel.updateMany(
      { ruleset, deletedAt },
      { $set: { deletedAt: null } }
    );
  }

  private format(doc: EntityOverrideMongo): EntityOverrideApi {
    return {
      id: doc._id.toString(),
      ruleset: doc.ruleset,
      entityType: doc.entityType,
      sourceId: doc.sourceId,
      patch: sanitizeFlavorPatch(doc.patch ?? {})
    };
  }
}
