import ConditionService from "../../../domain/services/condition.service";
import { ConditionApi } from "../../../domain/types/condition.types";

export default class GetConditionsBySystem {
  constructor(private readonly conditionService: ConditionService) {}

  execute(rulesets: string[], userId?: string): Promise<ConditionApi[]> {
    return this.conditionService.getBySystems(rulesets, userId);
  }
}
