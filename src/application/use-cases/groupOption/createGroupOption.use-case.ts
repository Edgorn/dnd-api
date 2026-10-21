import GroupOptionService from "../../../domain/services/groupOption.service";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { GroupOptionApi, InputCreateGroupOption } from "../../../domain/types/optionGroup.types";

export default class CreateGroupOption {
  constructor(
    private readonly groupOptionService: GroupOptionService,
    private readonly optionGroupService: OptionGroupService,
    private readonly traitService: TraitService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateGroupOption, userId: string): Promise<GroupOptionApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }
    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear opciones en este sistema", 403);
    }

    const group = await this.optionGroupService.getById(data.groupId);
    if (!group) {
      throw new AppError("Grupo de opciones no encontrado", 404);
    }

    const trait = await this.traitService.getById(data.traitId);
    if (!trait) {
      throw new AppError("Rasgo no encontrado", 404);
    }

    return this.groupOptionService.create(data);
  }
}
