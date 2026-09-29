import ConditionService from "../../../domain/services/condition.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { ConditionApi, InputUpdateCondition } from "../../../domain/types/condition.types";

export default class UpdateCondition {
  constructor(
    private readonly conditionService: ConditionService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateCondition, userId: string): Promise<ConditionApi> {
    const existing = await this.conditionService.getById(data.id);
    if (!existing) {
      throw new AppError("Estado no encontrado", 404);
    }

    await this.assertPublisher(existing.ruleset, userId, "No tienes permisos para editar este estado");

    if (data.ruleset && data.ruleset !== existing.ruleset) {
      await this.assertPublisher(data.ruleset, userId, "No tienes permisos para mover este estado a ese sistema");
    }

    return this.conditionService.update(data);
  }

  private async assertPublisher(ruleset: string, userId: string, forbiddenMessage: string): Promise<void> {
    const system = await this.systemService.getById(ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError(forbiddenMessage, 403);
    }
  }
}
