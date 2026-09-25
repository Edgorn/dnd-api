import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import ArmorTypeService from "../../../domain/services/armorType.service";
import LanguageService from "../../../domain/services/language.service";
import DamageService from "../../../domain/services/damage.service";
import { AppError } from "../../../domain/errors/AppError";
import { TraitApi, UpdateTrait } from "../../../domain/types/traits.types";
import { assertArmorTypesForRuleset } from "../equipment/assertArmorTypeForRuleset";
import { assertTraitCatalogRefs } from "./assertTraitCatalogRefs";

export default class UpdateTraitUseCase {
  constructor(
    private readonly traitService: TraitService,
    private readonly systemService: SystemService,
    private readonly armorTypeService: ArmorTypeService,
    private readonly languageService: LanguageService,
    private readonly damageService: DamageService
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

    const ruleset = trait.ruleset ?? existingTrait.ruleset;

    await assertArmorTypesForRuleset(
      trait.suppressedByArmorTypeIds,
      existingTrait.ruleset,
      this.armorTypeService,
      this.systemService
    );
    await assertArmorTypesForRuleset(
      trait.ignoresArmorSpeedPenaltyForTypeIds,
      existingTrait.ruleset,
      this.armorTypeService,
      this.systemService
    );

    const normalized = await assertTraitCatalogRefs({
      ruleset,
      languages: trait.languages,
      resistances: trait.resistances,
      damageChoices: trait.damageChoices,
      damageChoiceRef: trait.damageChoiceRef,
      languageService: this.languageService,
      damageService: this.damageService,
      systemService: this.systemService,
      traitService: this.traitService
    });

    return this.traitService.update({
      ...trait,
      ...(normalized.languages !== undefined ? { languages: normalized.languages } : {}),
      ...(normalized.damageChoiceRef !== undefined ? { damageChoiceRef: normalized.damageChoiceRef } : {})
    });
  }
}
