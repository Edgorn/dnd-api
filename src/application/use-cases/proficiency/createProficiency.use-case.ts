import ProficiencyService from "../../../domain/services/proficiency.service";
import SystemService from "../../../domain/services/system.service";
import { ProficiencyApi } from "../../../domain/types/proficiencies.types";
import { AppError } from "../../../domain/errors/AppError";

export default class CreateProficiency {
  constructor(
    private readonly proficiencyService: ProficiencyService,
    private readonly systemService: SystemService
  ) {}

  async execute(proficiency: Omit<ProficiencyApi, "id" | "deletedAt">, userEmail: string): Promise<ProficiencyApi> {
    const sys = await this.systemService.getByIdWithDeleted(proficiency.ruleset);
    if (!sys || (sys.publisher !== userEmail && !sys.isOpen)) {
        throw new AppError("No tienes permisos de edición para este sistema", 403);
    }
    return await this.proficiencyService.createProficiency(proficiency);
  }
}
