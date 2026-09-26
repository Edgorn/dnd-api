import {
  CreatureTypeApi,
  InputCreateCreatureType,
  InputUpdateCreatureType
} from "../types/creatureType.types";

export default interface ICreatureTypeRepository {
  getBySystems(rulesets: string[], userId?: string): Promise<CreatureTypeApi[]>;
  getById(id: string): Promise<CreatureTypeApi | null>;
  getByIds(ids: string[]): Promise<CreatureTypeApi[]>;
  create(data: InputCreateCreatureType): Promise<CreatureTypeApi>;
  update(data: InputUpdateCreatureType): Promise<CreatureTypeApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
