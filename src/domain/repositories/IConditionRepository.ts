import {
  ConditionApi,
  InputCreateCondition,
  InputUpdateCondition
} from "../types/condition.types";

export default interface IConditionRepository {
  getBySystems(rulesets: string[], userId?: string): Promise<ConditionApi[]>;
  getById(id: string): Promise<ConditionApi | null>;
  getByIds(ids: string[]): Promise<ConditionApi[]>;
  create(data: InputCreateCondition): Promise<ConditionApi>;
  update(data: InputUpdateCondition): Promise<ConditionApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
