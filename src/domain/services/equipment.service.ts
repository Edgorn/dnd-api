import IEquipmentRepository from "../repositories/IEquipmentRepository";
import {
  EquipmentApi,
  InputCreateEquipment,
  InputUpdateEquipment,
  CharacterEquipmentMongo,
  CharacterEquipmentApi,
  EquipmentOptionsMongo,
  EquipmentChoiceApi,
  EquipmentBasic
} from "../types/equipment.types";

export default class EquipmentService {
  constructor(private readonly equipmentRepository: IEquipmentRepository) { }

  create(data: InputCreateEquipment): Promise<EquipmentApi> {
    return this.equipmentRepository.create(data);
  }

  update(data: InputUpdateEquipment): Promise<EquipmentApi> {
    return this.equipmentRepository.update(data);
  }

  getById(id: string): Promise<EquipmentApi | null> {
    return this.equipmentRepository.getById(id);
  }

  getBySystems(rulesets: string[]): Promise<EquipmentApi[]> {
    return this.equipmentRepository.getBySystems(rulesets);
  }

  softDelete(id: string): Promise<void> {
    return this.equipmentRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.equipmentRepository.restore(id);
  }

  getCharacterEquipmentsByIds(equipments: CharacterEquipmentMongo[]): Promise<CharacterEquipmentApi[] | undefined> {
    return this.equipmentRepository.getCharacterEquipmentsByIds(equipments);
  }

  formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined> {
    return this.equipmentRepository.formatEquipmentChoices(choices);
  }

  getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]> {
    return this.equipmentRepository.getEquipmentsByTypes(types);
  }

  // Compatibility helper
  obtenerEquipamientosPorTipos(types: string[]): Promise<EquipmentBasic[]> {
    return this.getEquipmentsByTypes(types);
  }
}
