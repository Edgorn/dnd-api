import EquipmentService from "../../../domain/services/equipment.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreEquipment {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly systemService: SystemService
  ) { }

  async execute(id: string, userId: string): Promise<void> {
    const equipment = await this.equipmentService.getById(id);
    if (!equipment) {
      throw new AppError("Equipamiento no encontrado", 404);
    }

    const system = await this.systemService.getById(equipment.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este equipamiento", 403);
    }

    await this.equipmentService.restore(id);
  }
}
