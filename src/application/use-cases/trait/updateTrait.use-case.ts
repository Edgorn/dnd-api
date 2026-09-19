import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import ArmorTypeService from "../../../domain/services/armorType.service";
import { AppError } from "../../../domain/errors/AppError";
import { TraitApi, UpdateTrait } from "../../../domain/types/traits.types";
import { assertArmorTypesForRuleset } from "../equipment/assertArmorTypeForRuleset";

export default class UpdateTraitUseCase {
  constructor(
    private readonly traitService: TraitService,
    private readonly systemService: SystemService,
    private readonly armorTypeService: ArmorTypeService
  ) { }

  async execute(trait: UpdateTrait, userId: string): Promise<TraitApi> {
    const existingTrait = await this.traitService.getById(trait.id);
    if (!existingTrait) {
      throw new AppError("Trait no encontrado", 404);
    }

    const system = await this.systemService.getById(existingTrait.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para modificar este rasgo", 403);
    }

    await assertArmorTypesForRuleset(
      trait.suppressedByArmorTypeIds,
      existingTrait.ruleset,
      this.armorTypeService,
      this.systemService
    );

    return this.traitService.update(trait);
  }
}
