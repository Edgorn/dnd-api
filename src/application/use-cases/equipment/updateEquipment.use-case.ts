import EquipmentService from "../../../domain/services/equipment.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { EquipmentApi, InputUpdateEquipment } from "../../../domain/types/equipment.types";

export default class UpdateEquipment {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputUpdateEquipment, userId: string): Promise<EquipmentApi> {
    const equipment = await this.equipmentService.getById(data.id);
    if (!equipment) {
      throw new AppError("Equipamiento no encontrado", 404);
    }

    const system = await this.systemService.getById(equipment.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar este equipamiento", 403);
    }

    return this.equipmentService.update(data);
  }
}
