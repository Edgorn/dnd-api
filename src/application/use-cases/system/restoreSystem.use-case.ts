import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class RestoreSystem {
  constructor(private readonly systemService: SystemService) {}

  async execute(id: string, userId: string): Promise<void> {
    const system = await this.systemService.obtenerPorId(id);
    if (!system) {
      throw new AppError("Sistema no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este sistema", 403);
    }

    await this.systemService.restore(id);
  }
}
