import SkillService from "../../../domain/services/skill.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteSkill {
  constructor(
    private readonly skillService: SkillService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const skill = await this.skillService.getById(id);
    if (!skill) {
      throw new AppError("Habilidad no encontrada", 404);
    }

    const system = await this.systemService.obtenerPorId(skill.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar esta habilidad", 403);
    }

    await this.skillService.softDelete(id);
  }
}
