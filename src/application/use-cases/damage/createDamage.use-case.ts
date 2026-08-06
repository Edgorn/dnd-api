import DamageService from "../../../domain/services/damage.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { Damage, InputCreateDamage } from "../../../domain/types/damage.types";

export default class CreateDamage {
  constructor(
    private readonly damageService: DamageService,
    private readonly systemService: SystemService
  ) {}

  async execute(data: InputCreateDamage, userId: string): Promise<Damage> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear tipos de daño en este sistema", 403);
    }

    return this.damageService.create(data);
  }
}
