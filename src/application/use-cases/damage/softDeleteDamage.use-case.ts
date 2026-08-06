import DamageService from "../../../domain/services/damage.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export default class SoftDeleteDamage {
  constructor(
    private readonly damageService: DamageService,
    private readonly systemService: SystemService
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const damage = await this.damageService.getById(id);
    if (!damage) {
      throw new AppError("Tipo de daño no encontrado", 404);
    }

    const system = await this.systemService.getById(damage.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar este tipo de daño", 403);
    }

    await this.damageService.softDelete(id);
  }
}
