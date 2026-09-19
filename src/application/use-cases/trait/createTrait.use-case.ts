import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import ArmorTypeService from "../../../domain/services/armorType.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreateTrait, TraitApi } from "../../../domain/types/traits.types";
import { assertArmorTypesForRuleset } from "../equipment/assertArmorTypeForRuleset";

export default class CreateTraitUseCase {
  constructor(
    private readonly traitService: TraitService,
    private readonly systemService: SystemService,
    private readonly armorTypeService: ArmorTypeService
  ) { }

  async execute(trait: CreateTrait, userId: string): Promise<TraitApi> {
    const system = await this.systemService.getById(trait.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear rasgos en este sistema", 403);
    }

    await assertArmorTypesForRuleset(
      trait.suppressedByArmorTypeIds,
      trait.ruleset,
      this.armorTypeService,
      this.systemService
    );

    return this.traitService.create(trait);
  }
}
