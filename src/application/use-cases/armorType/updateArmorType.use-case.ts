import ArmorTypeService from "../../../domain/services/armorType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { ArmorType, InputUpdateArmorType } from "../../../domain/types/armorType.types";

export default class UpdateArmorType {
  constructor(
    private readonly armorTypeService: ArmorTypeService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateArmorType, userId: string): Promise<ArmorType> {
    const armorType = await this.armorTypeService.getById(data.id);
    if (!armorType) {
      throw new AppError("Tipo de armadura no encontrado", 404);
    }

    const system = await this.systemService.getById(armorType.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para editar este tipo de armadura", 403);
    }

    return this.armorTypeService.update(data);
  }
}
