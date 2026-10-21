import GroupOptionService from "../../../domain/services/groupOption.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreGroupOption {
  constructor(
    private readonly groupOptionService: GroupOptionService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const option = await this.groupOptionService.getById(id);
    if (!option) {
      throw new AppError("Opción de grupo no encontrada", 404);
    }

    const system = await this.systemService.getById(option.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }
    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar esta opción", 403);
    }

    await this.groupOptionService.restore(id);
  }
}
