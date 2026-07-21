import SkillService from "../../../domain/services/skill.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { SkillApi, InputUpdateSkill } from "../../../domain/types/skill.types";

export default class UpdateSkill {
  constructor(
    private readonly skillService: SkillService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputUpdateSkill, userId: string): Promise<SkillApi> {
    const skill = await this.skillService.getById(data.id);
    if (!skill) {
      throw new AppError("Habilidad no encontrada", 404);
    }

    const system = await this.systemService.getById(skill.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar esta habilidad", 403);
    }

    return this.skillService.update(data);
  }
}
