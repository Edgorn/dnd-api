import {
  CreateCreature,
  CreatureApi,
  CreatureListFilters,
  UpdateCreature
} from "../types/creature.types";

export default interface ICreatureRepository {
  getBySystems(rulesets: string[], filters?: CreatureListFilters, userId?: string): Promise<CreatureApi[]>;
  getById(id: string): Promise<CreatureApi | null>;
  getByIds(ids: string[]): Promise<CreatureApi[]>;
  create(data: CreateCreature): Promise<CreatureApi>;
  update(data: UpdateCreature): Promise<CreatureApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
