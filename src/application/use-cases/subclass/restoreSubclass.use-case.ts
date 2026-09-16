import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreSubclass {
  constructor(
    private readonly subclassService: SubclassService,
    private readonly systemService: SystemService
  ) { }

  async execute(id: string, userId: string): Promise<void> {
    const subclass = await this.subclassService.getById(id);
    if (!subclass) {
      throw new AppError("Subclase no encontrada", 404);
    }

    const system = await this.systemService.getById(subclass.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar esta subclase", 403);
    }

    await this.subclassService.restore(id);
  }
}
