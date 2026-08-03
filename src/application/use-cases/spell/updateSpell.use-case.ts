import SpellService from "../../../domain/services/spell.service";
import SystemService from "../../../domain/services/system.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { SpellApi, InputUpdateSpell } from "../../../domain/types/spell.types";

export default class UpdateSpell {
  constructor(
    private readonly spellService: SpellService,
    private readonly systemService: SystemService
  ) { }

  async execute(data: InputUpdateSpell, userId: string): Promise<SpellApi> {
    const existingSpell = await this.spellService.getById(data.id);
    if (!existingSpell) {
      throw new NotFoundError(`No se encontró el conjuro con ID: ${data.id}`);
    }

    const system = await this.systemService.getById(existingSpell.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar conjuros en este sistema", 403);
    }

    return this.spellService.update(data);
  }
}
