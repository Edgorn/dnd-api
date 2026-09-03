import EquipmentService from "../../../domain/services/equipment.service";
import { EquipmentBasic } from "../../../domain/types/equipment.types";

export default class GetEquipmentsWeapons {
  constructor(private readonly equipmentService: EquipmentService) { }

  async execute(rulesets?: string[]): Promise<EquipmentBasic[]> {
    return this.equipmentService.getWeapons(rulesets ?? []);
  }
}
