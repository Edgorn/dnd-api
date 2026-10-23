import SpellService from "../../../domain/services/spell.service";
import { SpellApi } from "../../../domain/types/spell.types";

export default class GetNonRitualSpells {
  constructor(private readonly spellService: SpellService) { }

  execute(rulesets: string[] = []): Promise<SpellApi[]> {
    return this.spellService.getNonRitualSpells(rulesets);
  }
}
