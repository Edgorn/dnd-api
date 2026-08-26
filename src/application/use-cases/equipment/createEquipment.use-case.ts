import EquipmentService from "../../../domain/services/equipment.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { EquipmentApi, InputCreateEquipment } from "../../../domain/types/equipment.types";

export default class CreateEquipment {
  constructor(
    private readonly equipmentService: EquipmentService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputCreateEquipment, userId: string): Promise<EquipmentApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear equipamiento en este sistema", 403);
    }

    return this.equipmentService.create(data);
  }
}
