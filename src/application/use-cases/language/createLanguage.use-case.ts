import LanguageService from "../../../domain/services/language.service";
import { LanguageApi, InputCreateLanguage } from "../../../domain/types/language.types";

export default class CreateLanguage {
  constructor(private readonly languageService: LanguageService) { }

  execute(language: InputCreateLanguage): Promise<LanguageApi> {
    return this.languageService.create(language);
  }
}
