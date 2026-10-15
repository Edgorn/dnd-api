import ISpellRepository from "../repositories/ISpellRepository";
import { ChoiceMongo } from "../types";
import { FormatSpellChoicesContext, SpellChoiceApi, SpellChoiceMongo } from "../types/classLevelChoices.types";
import { ChoiceSpell, InputCreateSpell, InputUpdateSpell, SpellApi } from "../types/spell.types";

export default class SpellService {
  constructor(private readonly spellRepository: ISpellRepository) { }

  create(data: InputCreateSpell): Promise<SpellApi> {
    return this.spellRepository.create(data);
  }

  update(data: InputUpdateSpell): Promise<SpellApi> {
    return this.spellRepository.update(data);
  }

  getBySystems(rulesets: string[]): Promise<SpellApi[]> {
    return this.spellRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<SpellApi | null> {
    return this.spellRepository.getById(id);
  }

  softDelete(id: string): Promise<void> {
    return this.spellRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.spellRepository.restore(id);
  }

  getSpellsByLevel(level: number, rulesets: string[] = [], className?: string): Promise<SpellApi[]> {
    return this.spellRepository.getSpellsByLevelAndClass(level, rulesets, className);
  }

  getRitualSpells(rulesets: string[] = []): Promise<SpellApi[]> {
    return this.spellRepository.getRitualSpells(rulesets);
  }

  formatSpellChoices(
    choices: (ChoiceMongo | ChoiceSpell | SpellChoiceMongo)[] | undefined,
    context?: FormatSpellChoicesContext
  ): Promise<SpellChoiceApi[] | undefined> {
    return this.spellRepository.formatSpellChoices(choices, context);
  }

  getSpellsByIndexes(indexes: string[]): Promise<SpellApi[]> {
    return this.spellRepository.getSpellsByIndexes(indexes);
  }
}
