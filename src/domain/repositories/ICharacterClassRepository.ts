import { CharacterClassApi, ClaseLevelUp, InputCreateCharacterClass, InputUpdateCharacterClass, SpellcastingLevelSource } from "../types/characterClass.types";

export default interface ICharacterClassRepository {
  getBySystems(rulesets: string[], includeDeleted?: boolean): Promise<CharacterClassApi[]>;
  getById(id: string): Promise<CharacterClassApi | null>;
  create(data: InputCreateCharacterClass): Promise<CharacterClassApi>;
  update(data: InputUpdateCharacterClass): Promise<CharacterClassApi>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  dataLevelUp(idClase: string, level: number, subclasses: string[]): Promise<ClaseLevelUp | null>;
  spellcastingClases(clases: { id: string; level: number }[]): Promise<(SpellcastingLevelSource | null)[]>;
}
