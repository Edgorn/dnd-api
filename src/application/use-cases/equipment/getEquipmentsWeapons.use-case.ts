import EquipmentService from "../../../domain/services/equipment.service";
import { EquipmentWeaponList } from "../../../domain/types/equipment.types";

export default class GetEquipmentsWeapons {
  constructor(private readonly equipmentService: EquipmentService) { }

  async execute(rulesets?: string[]): Promise<EquipmentWeaponList[]> {
    return this.equipmentService.getWeapons(rulesets ?? []);
  }
}
