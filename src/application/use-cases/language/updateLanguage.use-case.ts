import LanguageService from "../../../domain/services/language.service";
import { LanguageApi, InputUpdateLanguage } from "../../../domain/types/language.types";

export default class UpdateLanguage {
  constructor(private readonly languageService: LanguageService) { }

  execute(language: InputUpdateLanguage): Promise<LanguageApi> {
    return this.languageService.update(language);
  }
}
