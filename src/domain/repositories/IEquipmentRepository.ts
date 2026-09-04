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
import { ChoiceApi, ChoiceMongo } from "../types";

export default interface IEquipmentRepository {
  create(data: InputCreateEquipment): Promise<EquipmentApi>;
  update(data: InputUpdateEquipment): Promise<EquipmentApi>;
  getById(id: string): Promise<EquipmentApi | null>;
  getBySystems(rulesets: string[]): Promise<EquipmentApi[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset?(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset?(ruleset: string, deletedAt: Date): Promise<void>;
  getCharacterEquipmentsByIds(equipments: CharacterEquipmentMongo[]): Promise<CharacterEquipmentApi[] | undefined>;
  formatEquipmentChoices(choices: EquipmentOptionsMongo[][] | undefined): Promise<EquipmentChoiceApi[][] | undefined>;
  formatEquipmentItemChoices(choices: ChoiceMongo[] | undefined, ruleset?: string): Promise<ChoiceApi<EquipmentApi>[] | undefined>;
  getEquipmentsByTypes(types: string[]): Promise<EquipmentBasic[]>;
  getWeapons(rulesets: string[]): Promise<EquipmentBasic[]>;
  getArmor(rulesets: string[]): Promise<EquipmentBasic[]>;
}
