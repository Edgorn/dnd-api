import GroupOptionService from "../../../domain/services/groupOption.service";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { GroupOptionApi, InputUpdateGroupOption } from "../../../domain/types/optionGroup.types";

export default class UpdateGroupOption {
  constructor(
    private readonly groupOptionService: GroupOptionService,
    private readonly optionGroupService: OptionGroupService,
    private readonly traitService: TraitService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateGroupOption, userId: string): Promise<GroupOptionApi> {
    const option = await this.groupOptionService.getById(data.id);
    if (!option) {
      throw new AppError("Opción de grupo no encontrada", 404);
    }

    const system = await this.systemService.getById(option.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }
    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar esta opción", 403);
    }

    if (data.groupId) {
      const group = await this.optionGroupService.getById(data.groupId);
      if (!group) {
        throw new AppError("Grupo de opciones no encontrado", 404);
      }
    }

    if (data.traitId) {
      const trait = await this.traitService.getById(data.traitId);
      if (!trait) {
        throw new AppError("Rasgo no encontrado", 404);
      }
    }

    return this.groupOptionService.update(data);
  }
}
