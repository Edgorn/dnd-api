import {
  EquipmentApi,
  InputCreateEquipment,
  InputUpdateEquipment,
  CharacterEquipmentMongo,
  ArmorClassEquipmentInput,
  EquipmentInstanceApi,
  EquipmentOptionsMongo,
  EquipmentChoiceApi,
  EquipmentChoiceMongo,
  ResolvedEquipmentChoiceApi,
  EquipmentBasic,
  EquipmentWeaponList,
  EquipmentListFilters
} from "../types/equipment.types";

export default interface IEquipmentRepository {
  create(data: InputCreateEquipment): Promise<EquipmentApi>;
  update(data: InputUpdateEquipment): Promise<EquipmentApi>;
  getById(id: string): Promise<EquipmentApi | null>;
  getNamesByIds(ids: string[]): Promise<Array<{ id: string; name: string }>>;
  getBySystems(rulesets: string[], filters?: EquipmentListFilters): Promise<EquipmentApi[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset?(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset?(ruleset: string, deletedAt: Date): Promise<void>;
  getCharacterEquipmentsByIds(equipments: CharacterEquipmentMongo[]): Promise<EquipmentInstanceApi[] | undefined>;
  getArmorClassInputsByIds(equipments: CharacterEquipmentMongo[]): Promise<ArmorClassEquipmentInput[]>;
  formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined>;
  formatEquipmentItemChoices(choices: EquipmentChoiceMongo[] | undefined, ruleset?: string): Promise<ResolvedEquipmentChoiceApi[] | undefined>;
  getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]>;
  getWeapons(rulesets: string[]): Promise<EquipmentWeaponList[]>;
  getArmor(rulesets: string[]): Promise<EquipmentBasic[]>;
  getGear(rulesets: string[]): Promise<EquipmentBasic[]>;
}
