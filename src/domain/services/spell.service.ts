import ISpellRepository from "../repositories/ISpellRepository";
import { ChoiceApi } from "../types";
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

  formatSpellChoices(choices: ChoiceSpell[] | undefined): Promise<ChoiceApi<SpellApi>[] | undefined> {
    return this.spellRepository.formatSpellChoices(choices);
  }

  getSpellsByIndexes(indexes: string[]): Promise<SpellApi[]> {
    return this.spellRepository.getSpellsByIndexes(indexes);
  }

  // Backwards compatibility methods
  obtenerConjurosPorNivel(nivel: number): Promise<SpellApi[]> {
    return this.getSpellsByLevel(nivel, []);
  }

  obtenerConjurosRituales(): Promise<SpellApi[]> {
    return this.getRitualSpells([]);
  }
}
