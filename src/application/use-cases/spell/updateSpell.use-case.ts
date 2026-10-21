import SpellService from "../../../domain/services/spell.service";
import SystemService from "../../../domain/services/system.service";
import CreatureService from "../../../domain/services/creature.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { SpellApi, InputUpdateSpell } from "../../../domain/types/spell.types";
import { assertSpellCreatureFormRefs } from "./assertSpellCreatureFormRefs";

export default class UpdateSpell {
  constructor(
    private readonly spellService: SpellService,
    private readonly systemService: SystemService,
    private readonly creatureService: CreatureService,
    private readonly creatureTypeService: CreatureTypeService
  ) { }

  async execute(data: InputUpdateSpell, userId: string): Promise<SpellApi> {
    const existingSpell = await this.spellService.getById(data.id);
    if (!existingSpell) {
      throw new NotFoundError("Conjuro no encontrado");
    }

    const system = await this.systemService.getById(existingSpell.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar conjuros en este sistema", 403);
    }

    if (data.creatureForm) {
      await assertSpellCreatureFormRefs({
        ruleset: existingSpell.ruleset,
        creatureForm: data.creatureForm,
        creatureService: this.creatureService,
        creatureTypeService: this.creatureTypeService,
        systemService: this.systemService
      });
    }

    const creatureForm = data.creatureForm
      ? {
          purpose: data.creatureForm.purpose,
          choose: data.creatureForm.choose ?? 1,
          replaceOnRecast: data.creatureForm.replaceOnRecast ?? true,
          pool: data.creatureForm.pool
        }
      : data.creatureForm;

    return this.spellService.update({
      ...data,
      ...(data.creatureForm !== undefined ? { creatureForm } : {})
    });
  }
}
