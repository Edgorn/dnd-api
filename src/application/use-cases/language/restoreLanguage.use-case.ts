import LanguageService from "../../../domain/services/language.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreLanguage {
  constructor(
    private readonly languageService: LanguageService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const language = await this.languageService.getById(id);
    if (!language) {
      throw new AppError("Idioma no encontrado", 404);
    }

    const system = await this.systemService.getById(language.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este idioma", 403);
    }

    await this.languageService.restore(id);
  }
}
