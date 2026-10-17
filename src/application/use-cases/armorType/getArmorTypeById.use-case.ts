import ArmorTypeService from "../../../domain/services/armorType.service";
import { NotFoundError } from "../../../domain/errors/AppError";
import { ArmorType } from "../../../domain/types/armorType.types";

export default class GetArmorTypeById {
  constructor(private readonly armorTypeService: ArmorTypeService) {}

  async execute(id: string): Promise<ArmorType> {
    const armorType = await this.armorTypeService.getById(id);
    if (!armorType) {
      throw new NotFoundError("Tipo de armadura no encontrado");
    }
    return armorType;
  }
}
