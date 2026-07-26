import ProficiencyService from "../../../domain/services/proficiency.service";
import SystemService from "../../../domain/services/system.service";
import { ProficiencyApi } from "../../../domain/types/proficiencies.types";
import { AppError } from "../../../domain/errors/AppError";

export default class UpdateProficiency {
  constructor(
    private readonly proficiencyService: ProficiencyService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, proficiency: Partial<Omit<ProficiencyApi, "id" | "deletedAt">>, userEmail: string): Promise<ProficiencyApi> {
    const existing = await this.proficiencyService.getProficiencyById(id);
    if (!existing) throw new AppError("Proficiency not found", 404);

    const sys = await this.systemService.getByIdWithDeleted(existing.ruleset);
    if (!sys || (sys.publisher !== userEmail && !sys.isOpen)) {
        throw new AppError("No tienes permisos", 403);
    }

    if (proficiency.ruleset && proficiency.ruleset !== existing.ruleset) {
      const sysNew = await this.systemService.getByIdWithDeleted(proficiency.ruleset);
      if (!sysNew || (sysNew.publisher !== userEmail && !sysNew.isOpen)) {
          throw new AppError("No tienes permisos", 403);
      }
    }

    const updated = await this.proficiencyService.updateProficiency(id, proficiency);
    if (!updated) throw new AppError("Failed to update Proficiency", 500);

    return updated;
  }
}
