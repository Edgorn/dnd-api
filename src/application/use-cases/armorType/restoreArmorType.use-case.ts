import ArmorTypeService from "../../../domain/services/armorType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreArmorType {
  constructor(
    private readonly armorTypeService: ArmorTypeService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const armorType = await this.armorTypeService.getById(id);
    if (!armorType) {
      throw new AppError("Tipo de armadura no encontrado", 404);
    }

    const system = await this.systemService.getById(armorType.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este tipo de armadura", 403);
    }

    await this.armorTypeService.restore(id);
  }
}
