import EquipmentService from "../../../domain/services/equipment.service";
import { EquipmentApi } from "../../../domain/types/equipment.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GetEquipmentById {
  constructor(private readonly equipmentService: EquipmentService) { }

  async execute(id: string): Promise<EquipmentApi> {
    const equipment = await this.equipmentService.getById(id);
    if (!equipment) {
      throw new NotFoundError(`No se encontró el equipamiento con ID: ${id}`);
    }
    return equipment;
  }
}
