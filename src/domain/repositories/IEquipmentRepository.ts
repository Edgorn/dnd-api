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

export default interface IEquipmentRepository {
  create(data: InputCreateEquipment): Promise<EquipmentApi>;
  update(data: InputUpdateEquipment): Promise<EquipmentApi>;
  getById(id: string): Promise<EquipmentApi | null>;
  getBySystems(rulesets: string[]): Promise<EquipmentApi[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset?(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset?(ruleset: string, deletedAt: Date): Promise<void>;
  getCharacterEquipmentsByIds(equipments: CharacterEquipmentMongo[]): Promise<EquipmentInstanceApi[] | undefined>;
  formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined>;
  formatEquipmentItemChoices(choices: EquipmentChoiceMongo[] | undefined, ruleset?: string): Promise<ResolvedEquipmentChoiceApi[] | undefined>;
  getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]>;
  getWeapons(rulesets: string[]): Promise<EquipmentBasic[]>;
  getArmor(rulesets: string[]): Promise<EquipmentBasic[]>;
}
