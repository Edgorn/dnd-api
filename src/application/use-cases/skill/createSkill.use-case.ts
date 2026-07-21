import SkillService from "../../../domain/services/skill.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { SkillApi, InputCreateSkill } from "../../../domain/types/skill.types";

export default class CreateSkill {
  constructor(
    private readonly skillService: SkillService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputCreateSkill, userId: string): Promise<SkillApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear habilidades en este sistema", 403);
    }

    return this.skillService.create(data);
  }
}
