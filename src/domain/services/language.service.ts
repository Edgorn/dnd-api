import LanguageRepository from "../../infrastructure/databases/mongoDb/repositories/language.repository";
import { LanguageApi, InputCreateLanguage, InputUpdateLanguage } from "../types/language.types";

export default class LanguageService {
  constructor(private readonly languageRepository: LanguageRepository) { }

  getBySystems(rulesets: string[], userId?: string): Promise<LanguageApi[]> {
    return this.languageRepository.getBySystems(rulesets, userId);
  }

  getById(id: string): Promise<LanguageApi | null> {
    return this.languageRepository.getById(id);
  }

  create(language: InputCreateLanguage): Promise<LanguageApi> {
    return this.languageRepository.create(language);
  }

  update(language: InputUpdateLanguage): Promise<LanguageApi> {
    return this.languageRepository.update(language);
  }

  softDelete(id: string): Promise<void> {
    return this.languageRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.languageRepository.restore(id);
  }
}
