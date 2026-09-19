import ArmorTypeService from "../../../domain/services/armorType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { ArmorType, InputCreateArmorType } from "../../../domain/types/armorType.types";

export default class CreateArmorType {
  constructor(
    private readonly armorTypeService: ArmorTypeService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateArmorType, userId: string): Promise<ArmorType> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear tipos de armadura en este sistema", 403);
    }

    return this.armorTypeService.create(data);
  }
}
