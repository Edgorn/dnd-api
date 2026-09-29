import ConditionService from "../../../domain/services/condition.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreCondition {
  constructor(
    private readonly conditionService: ConditionService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const condition = await this.conditionService.getById(id);
    if (!condition) {
      throw new AppError("Estado no encontrado", 404);
    }

    const system = await this.systemService.getById(condition.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este estado", 403);
    }

    await this.conditionService.restore(id);
  }
}
