import MagicSchoolService from "../../../domain/services/magicSchool.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { MagicSchoolApi, InputCreateMagicSchool } from "../../../domain/types/magicSchool.types";

export default class CreateMagicSchool {
  constructor(
    private readonly magicSchoolService: MagicSchoolService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateMagicSchool, userId: string): Promise<MagicSchoolApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear escuelas de magia en este sistema", 403);
    }

    return this.magicSchoolService.create(data);
  }
}
