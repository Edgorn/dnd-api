import EquipmentService from "../../../domain/services/equipment.service";
import { EquipmentApi } from "../../../domain/types/equipment.types";

export default class GetEquipmentsBySystems {
  constructor(private readonly equipmentService: EquipmentService) { }

  async execute(systems?: string[]): Promise<EquipmentApi[]> {
    const rulesets = systems ?? [];
    return this.equipmentService.getBySystems(rulesets);
  }
}
