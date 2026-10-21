import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { InputUpdateOptionGroup, OptionGroupApi } from "../../../domain/types/optionGroup.types";

export default class UpdateOptionGroup {
  constructor(
    private readonly optionGroupService: OptionGroupService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateOptionGroup, userId: string): Promise<OptionGroupApi> {
    const group = await this.optionGroupService.getById(data.id);
    if (!group) {
      throw new AppError("Grupo de opciones no encontrado", 404);
    }

    const system = await this.systemService.getById(group.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar este grupo de opciones", 403);
    }

    return this.optionGroupService.update(data);
  }
}
