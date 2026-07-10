import SystemService from "../../../domain/services/system.service";
import IAttributeRepository from "../../../domain/repositories/IAttributeRepository";
import ISkillRepository from "../../../domain/repositories/ISkillRepository";
import ILanguageRepository from "../../../domain/repositories/ILanguageRepository";
import { AppError } from "../../../domain/errors/AppError";

export default class CascadeSoftDeleteSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly attributeRepository: IAttributeRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly languageRepository: ILanguageRepository
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const system = await this.systemService.obtenerPorId(id);
    if (!system) {
      throw new AppError("Sistema no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar este sistema", 403);
    }

    // 1. Soft delete the system itself
    const deletedAt = new Date();
    await this.systemService.softDelete(id, deletedAt);

    // 2. Cascade soft delete associated entities by system ruleset
    await Promise.all([
      this.attributeRepository.softDeleteByRuleset(id, deletedAt),
      this.skillRepository.softDeleteByRuleset(id, deletedAt),
      this.languageRepository.softDeleteByRuleset(id, deletedAt)
    ]);
  }
}
