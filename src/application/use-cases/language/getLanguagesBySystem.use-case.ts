import LanguageService from "../../../domain/services/language.service";
import { LanguageApi } from "../../../domain/types/language.types";

export default class GetLanguagesBySystem {
  constructor(private readonly languageService: LanguageService) { }

  execute(rulesets: string[], userId?: string): Promise<LanguageApi[]> {
    return this.languageService.getBySystems(rulesets, userId);
  }
}
