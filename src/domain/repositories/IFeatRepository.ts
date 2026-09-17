import { ChoiceApi } from "../types";
import { FeatApi, InputCreateFeat, InputUpdateFeat } from "../types/feat.types";

export default interface IFeatRepository {
  create(data: InputCreateFeat): Promise<FeatApi>;
  update(data: InputUpdateFeat): Promise<FeatApi>;
  getById(id: string): Promise<FeatApi | null>;
  getBySystems(rulesets: string[], userId?: string): Promise<FeatApi[]>;
  getAll(): Promise<FeatApi[]>;
  getFeatsByIds(ids: string[]): Promise<FeatApi[]>;
  formatFeatChoices(count: number | undefined, ruleset?: string): Promise<ChoiceApi<FeatApi> | undefined>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
