import SpellService from "../../../domain/services/spell.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { SpellApi, InputCreateSpell } from "../../../domain/types/spell.types";

export default class CreateSpell {
  constructor(
    private readonly spellService: SpellService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputCreateSpell, userId: string): Promise<SpellApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear conjuros en este sistema", 403);
    }

    return this.spellService.create(data);
  }
}
