import { ChoiceMongo } from "../types";
import { FormatSpellChoicesContext, SpellChoiceApi, SpellChoiceMongo } from "../types/classLevelChoices.types";
import { ChoiceSpell, SpellApi, InputCreateSpell, InputUpdateSpell } from "../types/spell.types";

export default interface ISpellRepository {
  create(data: InputCreateSpell): Promise<SpellApi>;
  update(data: InputUpdateSpell): Promise<SpellApi>;
  getBySystems(rulesets: string[]): Promise<SpellApi[]>;
  getById(id: string): Promise<SpellApi | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  formatSpellChoices(
    choices: (ChoiceMongo | ChoiceSpell | SpellChoiceMongo)[] | undefined,
    context?: FormatSpellChoicesContext
  ): Promise<SpellChoiceApi[] | undefined>;
  getSpellsByIndexes(indexes: string[]): Promise<SpellApi[]>;
  getSpellsByLevelAndClass(level: number, rulesets: string[], className?: string): Promise<SpellApi[]>;
  getRitualSpells(rulesets: string[]): Promise<SpellApi[]>;
}
