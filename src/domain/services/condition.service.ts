import IConditionRepository from "../repositories/IConditionRepository";
import {
  ConditionApi,
  InputCreateCondition,
  InputUpdateCondition
} from "../types/condition.types";

export default class ConditionService {
  constructor(private readonly conditionRepository: IConditionRepository) {}

  getBySystems(rulesets: string[], userId?: string): Promise<ConditionApi[]> {
    return this.conditionRepository.getBySystems(rulesets, userId);
  }

  getById(id: string): Promise<ConditionApi | null> {
    return this.conditionRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<ConditionApi[]> {
    return this.conditionRepository.getByIds(ids);
  }

  create(data: InputCreateCondition): Promise<ConditionApi> {
    return this.conditionRepository.create(data);
  }

  update(data: InputUpdateCondition): Promise<ConditionApi> {
    return this.conditionRepository.update(data);
  }

  softDelete(id: string): Promise<void> {
    return this.conditionRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.conditionRepository.restore(id);
  }
}
