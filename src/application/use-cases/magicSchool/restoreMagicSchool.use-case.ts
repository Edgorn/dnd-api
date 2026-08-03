import MagicSchoolService from "../../../domain/services/magicSchool.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreMagicSchool {
  constructor(
    private readonly magicSchoolService: MagicSchoolService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const magicSchool = await this.magicSchoolService.getById(id);
    if (!magicSchool) {
      throw new AppError("Escuela de magia no encontrada", 404);
    }

    const system = await this.systemService.getById(magicSchool.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar esta escuela de magia", 403);
    }

    await this.magicSchoolService.restore(id);
  }
}
