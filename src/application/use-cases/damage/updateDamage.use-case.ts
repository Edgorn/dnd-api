import DamageService from "../../../domain/services/damage.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { Damage, InputUpdateDamage } from "../../../domain/types/damage.types";

export default class UpdateDamage {
  constructor(
    private readonly damageService: DamageService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputUpdateDamage, userId: string): Promise<Damage> {
    const damage = await this.damageService.getById(data.id);
    if (!damage) {
      throw new AppError("Tipo de daño no encontrado", 404);
    }

    const system = await this.systemService.getById(damage.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para editar este tipo de daño", 403);
    }

    return this.damageService.update(data);
  }
}
