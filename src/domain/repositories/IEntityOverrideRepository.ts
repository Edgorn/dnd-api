import {
  EntityOverrideApi,
  EntityOverrideType,
  UpsertEntityOverride
} from "../types/entityOverride.types";

export default interface IEntityOverrideRepository {
  upsert(data: UpsertEntityOverride): Promise<EntityOverrideApi>;
  getBySource(
    ruleset: string,
    entityType: EntityOverrideType,
    sourceId: string,
    includeDeleted?: boolean
  ): Promise<EntityOverrideApi | null>;
  getBySystems(rulesets: string[], entityType: EntityOverrideType): Promise<EntityOverrideApi[]>;
  softDelete(ruleset: string, entityType: EntityOverrideType, sourceId: string): Promise<boolean>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
