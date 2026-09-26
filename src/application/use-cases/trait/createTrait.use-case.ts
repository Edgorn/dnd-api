import TraitService from "../../../domain/services/trait.service";
import SystemService from "../../../domain/services/system.service";
import ArmorTypeService from "../../../domain/services/armorType.service";
import LanguageService from "../../../domain/services/language.service";
import DamageService from "../../../domain/services/damage.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreateTrait, TraitApi } from "../../../domain/types/traits.types";
import { assertArmorTypesForRuleset } from "../equipment/assertArmorTypeForRuleset";
import { assertTraitCatalogRefs } from "./assertTraitCatalogRefs";

export default class CreateTraitUseCase {
  constructor(
    private readonly traitService: TraitService,
    private readonly systemService: SystemService,
    private readonly armorTypeService: ArmorTypeService,
    private readonly languageService: LanguageService,
    private readonly damageService: DamageService,
    private readonly creatureTypeService: CreatureTypeService
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
    await assertArmorTypesForRuleset(
      trait.ignoresArmorSpeedPenaltyForTypeIds,
      trait.ruleset,
      this.armorTypeService,
      this.systemService
    );

    const normalized = await assertTraitCatalogRefs({
      ruleset: trait.ruleset,
      languages: trait.languages,
      resistances: trait.resistances,
      damageChoices: trait.damageChoices,
      catalogChoices: trait.catalogChoices,
      damageChoiceRef: trait.damageChoiceRef,
      languageService: this.languageService,
      damageService: this.damageService,
      creatureTypeService: this.creatureTypeService,
      systemService: this.systemService,
      traitService: this.traitService
    });

    return this.traitService.create({
      ...trait,
      ...(normalized.languages !== undefined ? { languages: normalized.languages } : {}),
      ...(normalized.damageChoiceRef !== undefined ? { damageChoiceRef: normalized.damageChoiceRef } : {})
    });
  }
}
