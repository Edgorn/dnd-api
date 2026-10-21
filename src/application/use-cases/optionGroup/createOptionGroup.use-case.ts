import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { InputCreateOptionGroup, OptionGroupApi } from "../../../domain/types/optionGroup.types";

export default class CreateOptionGroup {
  constructor(
    private readonly optionGroupService: OptionGroupService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateOptionGroup, userId: string): Promise<OptionGroupApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear grupos de opciones en este sistema", 403);
    }

    return this.optionGroupService.create(data);
  }
}
