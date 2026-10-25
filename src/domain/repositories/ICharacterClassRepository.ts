import {
  CharacterClassApi,
  CharacterClassCatalogItem,
  CharacterClassSummaryDraft,
  ClassRulesRef,
  ClaseLevelUp,
  DataLevelUpOptions,
  InputCreateCharacterClass,
  InputUpdateCharacterClass,
  SpellcastingLevelSource
} from "../types/characterClass.types";

export default interface ICharacterClassRepository {
  getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<CharacterClassApi[]>;
  getSummaries(rulesets: string[]): Promise<CharacterClassSummaryDraft[]>;
  getCatalog(rulesets: string[], includeMulticlass?: boolean): Promise<CharacterClassCatalogItem[]>;
  getById(id: string): Promise<CharacterClassApi | null>;
  getRulesByIds(ids: string[]): Promise<ClassRulesRef[]>;
  create(data: InputCreateCharacterClass): Promise<CharacterClassApi>;
  update(data: InputUpdateCharacterClass): Promise<CharacterClassApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  dataLevelUp(
    classId: string,
    level: number,
    subclasses: string[],
    rulesets: string[],
    options?: DataLevelUpOptions
  ): Promise<ClaseLevelUp | null>;
  getSpellcastingSources(classes: { id: string; level: number }[]): Promise<(SpellcastingLevelSource | null)[]>;
}
