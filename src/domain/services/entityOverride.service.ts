import IEntityOverrideRepository from "../repositories/IEntityOverrideRepository";
import {
  EntityOverrideApi,
  EntityOverrideType,
  UpsertEntityOverride
} from "../types/entityOverride.types";

export default class EntityOverrideService {
  constructor(private readonly entityOverrideRepository: IEntityOverrideRepository) {}

  upsert(data: UpsertEntityOverride): Promise<EntityOverrideApi> {
    return this.entityOverrideRepository.upsert(data);
  }

  getBySource(
    ruleset: string,
    entityType: EntityOverrideType,
    sourceId: string,
    includeDeleted: boolean = false
  ): Promise<EntityOverrideApi | null> {
    return this.entityOverrideRepository.getBySource(ruleset, entityType, sourceId, includeDeleted);
  }

  getBySystems(rulesets: string[], entityType: EntityOverrideType): Promise<EntityOverrideApi[]> {
    return this.entityOverrideRepository.getBySystems(rulesets, entityType);
  }

  softDelete(ruleset: string, entityType: EntityOverrideType, sourceId: string): Promise<boolean> {
    return this.entityOverrideRepository.softDelete(ruleset, entityType, sourceId);
  }

  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    return this.entityOverrideRepository.softDeleteByRuleset(ruleset, deletedAt);
  }

  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    return this.entityOverrideRepository.restoreByRuleset(ruleset, deletedAt);
  }
}
