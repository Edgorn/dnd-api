import { MagicSchoolApi, InputCreateMagicSchool, InputUpdateMagicSchool } from "../types/magicSchool.types";

export default interface IMagicSchoolRepository {
  create(data: InputCreateMagicSchool): Promise<MagicSchoolApi>;
  update(data: InputUpdateMagicSchool): Promise<MagicSchoolApi>;
  getBySystems(rulesets: string[]): Promise<MagicSchoolApi[]>;
  getById(id: string): Promise<MagicSchoolApi | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
