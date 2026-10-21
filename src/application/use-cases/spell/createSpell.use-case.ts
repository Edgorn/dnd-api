import SpellService from "../../../domain/services/spell.service";
import SystemService from "../../../domain/services/system.service";
import CreatureService from "../../../domain/services/creature.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import { AppError } from "../../../domain/errors/AppError";
import { SpellApi, InputCreateSpell } from "../../../domain/types/spell.types";
import { assertSpellCreatureFormRefs } from "./assertSpellCreatureFormRefs";

export default class CreateSpell {
  constructor(
    private readonly spellService: SpellService,
    private readonly systemService: SystemService,
    private readonly creatureService: CreatureService,
    private readonly creatureTypeService: CreatureTypeService
  ) { }

  async execute(data: InputCreateSpell, userId: string): Promise<SpellApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear conjuros en este sistema", 403);
    }

    await assertSpellCreatureFormRefs({
      ruleset: data.ruleset,
      creatureForm: data.creatureForm,
      creatureService: this.creatureService,
      creatureTypeService: this.creatureTypeService,
      systemService: this.systemService
    });

    return this.spellService.create({
      ...data,
      creatureForm: data.creatureForm
        ? {
            purpose: data.creatureForm.purpose,
            choose: data.creatureForm.choose ?? 1,
            replaceOnRecast: data.creatureForm.replaceOnRecast ?? true,
            pool: data.creatureForm.pool
          }
        : undefined
    });
  }
}
