import { Damage, InputCreateDamage, InputUpdateDamage } from "../types/damage.types";

export default interface IDamageRepository {
  create(data: InputCreateDamage): Promise<Damage>;
  update(data: InputUpdateDamage): Promise<Damage>;
  getById(id: string): Promise<Damage | null>;
  getByIds(ids: string[]): Promise<Damage[]>;
  getBySystems(rulesets: string[]): Promise<Damage[]>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
