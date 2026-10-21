import GroupOptionService from "../../../domain/services/groupOption.service";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import { AppError } from "../../../domain/errors/AppError";
import { GroupOptionApi } from "../../../domain/types/optionGroup.types";

export default class GetGroupOptionsByGroup {
  constructor(
    private readonly groupOptionService: GroupOptionService,
    private readonly optionGroupService: OptionGroupService
  ) {}

  async execute(groupId: string, rulesets?: string[]): Promise<Omit<GroupOptionApi, "deletedAt">[]> {
    const group = await this.optionGroupService.getById(groupId);
    if (!group) {
      throw new AppError("Grupo de opciones no encontrado", 404);
    }

    const systems = rulesets?.length ? rulesets : [group.ruleset];
    const options = await this.groupOptionService.getByGroup(groupId, systems);
    return options.map(({ deletedAt: _deletedAt, ...rest }) => rest);
  }
}
