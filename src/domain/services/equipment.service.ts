import IEquipmentRepository from "../repositories/IEquipmentRepository";
import {
  EquipmentApi,
  InputCreateEquipment,
  InputUpdateEquipment,
  CharacterEquipmentMongo,
  EquipmentInstanceApi,
  EquipmentOptionsMongo,
  EquipmentChoiceApi,
  EquipmentChoiceMongo,
  ResolvedEquipmentChoiceApi,
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

  getCharacterEquipmentsByIds(equipments: CharacterEquipmentMongo[]): Promise<EquipmentInstanceApi[] | undefined> {
    return this.equipmentRepository.getCharacterEquipmentsByIds(equipments);
  }

  formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined> {
    return this.equipmentRepository.formatEquipmentChoices(choices);
  }

  formatEquipmentItemChoices(
    choices: EquipmentChoiceMongo[] | undefined,
    ruleset?: string
  ): Promise<ResolvedEquipmentChoiceApi[] | undefined> {
    return this.equipmentRepository.formatEquipmentItemChoices(choices, ruleset);
  }

  getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]> {
    return this.equipmentRepository.getEquipmentsByTypes(types);
  }

  getWeapons(rulesets: string[] = []): Promise<EquipmentBasic[]> {
    return this.equipmentRepository.getWeapons(rulesets);
  }

  getArmor(rulesets: string[] = []): Promise<EquipmentBasic[]> {
    return this.equipmentRepository.getArmor(rulesets);
  }
}
