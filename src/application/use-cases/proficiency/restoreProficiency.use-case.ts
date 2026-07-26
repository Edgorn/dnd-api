import ProficiencyService from "../../../domain/services/proficiency.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreProficiency {
  constructor(
    private readonly proficiencyService: ProficiencyService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userEmail: string): Promise<void> {
    const restored = await this.proficiencyService.restoreProficiency(id);
    if (!restored) {
       throw new AppError("Proficiency not found or already restored", 404);
    }
  }
}
