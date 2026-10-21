import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteOptionGroup {
  constructor(
    private readonly optionGroupService: OptionGroupService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const group = await this.optionGroupService.getById(id);
    if (!group) {
      throw new AppError("Grupo de opciones no encontrado", 404);
    }

    const system = await this.systemService.getById(group.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar este grupo de opciones", 403);
    }

    await this.optionGroupService.softDelete(id);
  }
}
