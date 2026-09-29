import ConditionService from "../../../domain/services/condition.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { ConditionApi, InputCreateCondition } from "../../../domain/types/condition.types";

export default class CreateCondition {
  constructor(
    private readonly conditionService: ConditionService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateCondition, userId: string): Promise<ConditionApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear estados en este sistema", 403);
    }

    return this.conditionService.create(data);
  }
}
