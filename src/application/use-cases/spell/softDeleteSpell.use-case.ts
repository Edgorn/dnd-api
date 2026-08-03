import SpellService from "../../../domain/services/spell.service";
import SystemService from "../../../domain/services/system.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

export default class SoftDeleteSpell {
  constructor(
    private readonly spellService: SpellService,
    private readonly systemService: SystemService
  ) { }

  async execute(id: string, userId: string): Promise<void> {
    const existingSpell = await this.spellService.getById(id);
    if (!existingSpell) {
      throw new NotFoundError(`No se encontró el conjuro con ID: ${id}`);
    }

    const system = await this.systemService.getById(existingSpell.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para eliminar conjuros en este sistema", 403);
    }

    await this.spellService.softDelete(id);
  }
}
