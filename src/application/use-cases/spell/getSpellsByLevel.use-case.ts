import SpellService from "../../../domain/services/spell.service";
import { SpellApi } from "../../../domain/types/spell.types";

export default class GetSpellsByLevel {
  constructor(private readonly spellService: SpellService) { }

  execute(level: number, rulesets: string[] = [], className?: string): Promise<SpellApi[]> {
    return this.spellService.getSpellsByLevel(level, rulesets, className);
  }
}
