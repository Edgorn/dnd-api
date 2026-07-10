import SystemService from "../../../domain/services/system.service";
import IAttributeRepository from "../../../domain/repositories/IAttributeRepository";
import ISkillRepository from "../../../domain/repositories/ISkillRepository";
import ILanguageRepository from "../../../domain/repositories/ILanguageRepository";
import { AppError } from "../../../domain/errors/AppError";

export default class CascadeRestoreSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly attributeRepository: IAttributeRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly languageRepository: ILanguageRepository
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const system = await this.systemService.getByIdWithDeleted(id);
    if (!system) {
      throw new AppError("Sistema no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este sistema", 403);
    }

    const deletedAt = system.deletedAt;
    if (!deletedAt) {
      throw new AppError("El sistema no está eliminado", 400);
    }

    // 1. Restore the system itself
    await this.systemService.restore(id);

    // 2. Cascade restore associated entities by system ruleset
    await Promise.all([
      this.attributeRepository.restoreByRuleset(id, deletedAt),
      this.skillRepository.restoreByRuleset(id, deletedAt),
      this.languageRepository.restoreByRuleset(id, deletedAt)
    ]);
  }
}
