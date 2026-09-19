import ArmorTypeService from "../../../domain/services/armorType.service";
import { ArmorType } from "../../../domain/types/armorType.types";

export default class GetArmorTypesBySystems {
  constructor(private readonly armorTypeService: ArmorTypeService) {}

  async execute(systems?: string[]): Promise<Omit<ArmorType, "deletedAt">[]> {
    const rulesets = systems ?? [];
    const armorTypes = await this.armorTypeService.getBySystems(rulesets);
    return armorTypes.map(({ deletedAt, ...rest }) => rest);
  }
}
