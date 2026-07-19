import { ChoiceApi, ChoiceMongo } from "../types"
import { InputCreateLanguage, InputUpdateLanguage, LanguageApi } from "../types/language.types"

export default interface ILanguageRepository {
  getLanguagesByIndex(indexes: string[]): Promise<LanguageApi[]>
  getAll(): Promise<LanguageApi[]>
  getBySystems(rulesets: string[], userId?: string): Promise<LanguageApi[]>
  formatLanguageChoices(choices: ChoiceMongo | undefined, ruleset?: string): Promise<ChoiceApi<LanguageApi> | undefined>
  create(language: InputCreateLanguage): Promise<LanguageApi>
  update(language: InputUpdateLanguage): Promise<LanguageApi>
  getById(id: string): Promise<LanguageApi | null>
  softDelete(id: string): Promise<void>
  restore(id: string): Promise<void>
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
