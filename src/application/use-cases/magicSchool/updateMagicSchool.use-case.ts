import MagicSchoolService from "../../../domain/services/magicSchool.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { MagicSchoolApi, InputUpdateMagicSchool } from "../../../domain/types/magicSchool.types";

export default class UpdateMagicSchool {
  constructor(
    private readonly magicSchoolService: MagicSchoolService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateMagicSchool, userId: string): Promise<MagicSchoolApi> {
    const existing = await this.magicSchoolService.getById(data.id);
    if (!existing) {
      throw new AppError("Escuela de magia no encontrada", 404);
    }

    const system = await this.systemService.getById(existing.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para editar esta escuela de magia", 403);
    }

    return this.magicSchoolService.update(data);
  }
}
