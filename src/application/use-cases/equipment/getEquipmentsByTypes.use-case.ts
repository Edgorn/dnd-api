import EquipmentService from "../../../domain/services/equipment.service";
import { EquipmentBasic } from "../../../domain/types/equipment.types";

export default class GetEquipmentsByTypes {
  constructor(private readonly equipmentService: EquipmentService) { }

  async execute(types: string[]): Promise<EquipmentBasic[]> {
    return this.equipmentService.getEquipmentsByTypes(types);
  }
}
