import EquipmentService from "../../../domain/services/equipment.service";
import { EquipmentApi, EquipmentListFilters } from "../../../domain/types/equipment.types";

export default class GetEquipmentsBySystems {
  constructor(private readonly equipmentService: EquipmentService) { }

  async execute(systems?: string[], filters?: EquipmentListFilters): Promise<EquipmentApi[]> {
    const rulesets = systems ?? [];
    return this.equipmentService.getBySystems(rulesets, filters);
  }
}
