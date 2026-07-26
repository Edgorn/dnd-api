import ProficiencyService from "../../../domain/services/proficiency.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteProficiency {
  constructor(
    private readonly proficiencyService: ProficiencyService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userEmail: string): Promise<void> {
    const existing = await this.proficiencyService.getProficiencyById(id);
    if (!existing) throw new AppError("Proficiency not found", 404);

    const sys = await this.systemService.getByIdWithDeleted(existing.ruleset);
    if (!sys || (sys.publisher !== userEmail && !sys.isOpen)) {
        throw new AppError("No tienes permisos", 403);
    }

    const deleted = await this.proficiencyService.softDeleteProficiency(id);
    if (!deleted) throw new AppError("Failed to soft delete Proficiency", 500);
  }
}
