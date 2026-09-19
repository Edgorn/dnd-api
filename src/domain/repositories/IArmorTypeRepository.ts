import { ArmorType, InputCreateArmorType, InputUpdateArmorType } from "../types/armorType.types";

export default interface IArmorTypeRepository {
  create(data: InputCreateArmorType): Promise<ArmorType>;
  update(data: InputUpdateArmorType): Promise<ArmorType>;
  getById(id: string): Promise<ArmorType | null>;
  getByIds(ids: string[]): Promise<ArmorType[]>;
  getBySystems(rulesets: string[]): Promise<ArmorType[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
