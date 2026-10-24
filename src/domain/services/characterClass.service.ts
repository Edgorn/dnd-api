import ICharacterClassRepository from "../repositories/ICharacterClassRepository";
import {
  CharacterClassApi,
  CharacterClassCatalogItem,
  CharacterClassMulticlassCreate,
  CharacterClassSummaryDraft,
  InputCreateCharacterClass,
  InputUpdateCharacterClass
} from "../types/characterClass.types";
import { AttributeRequirementsCreate } from "../types/attributeRequirement.types";
import { ValidationError } from "../errors/AppError";
import AttributeService from "./attribute.service";
import OptionGroupService from "./optionGroup.service";

export default class CharacterClassService {
  constructor(
    private readonly characterClassRepository: ICharacterClassRepository,
    private readonly attributeService: AttributeService,
    private readonly optionGroupService: OptionGroupService
  ) { }

  getBySystems(rulesets: string[]): Promise<CharacterClassApi[]> {
    return this.characterClassRepository.getBySystems(rulesets);
  }

  getSummaries(rulesets: string[]): Promise<CharacterClassSummaryDraft[]> {
    return this.characterClassRepository.getSummaries(rulesets);
  }

  getCatalog(rulesets: string[], includeMulticlass?: boolean): Promise<CharacterClassCatalogItem[]> {
    return this.characterClassRepository.getCatalog(rulesets, includeMulticlass);
  }

  getById(id: string): Promise<CharacterClassApi | null> {
    return this.characterClassRepository.getById(id);
  }

  async create(data: InputCreateCharacterClass): Promise<CharacterClassApi> {
    await this.assertAttributeKeys(data.ruleset, data.multiclass?.requirements);
    await this.assertAbilityScoreAlternativeGroup(data.ruleset, data.abilityScoreAlternativeGroupId);
    return this.characterClassRepository.create(data);
  }

  async update(data: InputUpdateCharacterClass): Promise<CharacterClassApi> {
    const ruleset = await this.resolveUpdateRuleset(data);
    await this.assertAttributeKeys(
      ruleset,
      data.multiclass === null ? undefined : data.multiclass?.requirements
    );
    await this.assertAbilityScoreAlternativeGroup(ruleset, data.abilityScoreAlternativeGroupId);
    return this.characterClassRepository.update(data);
  }

  softDelete(id: string): Promise<void> {
    return this.characterClassRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.characterClassRepository.restore(id);
  }

  private async resolveUpdateRuleset(data: InputUpdateCharacterClass): Promise<string | undefined> {
    if (data.ruleset) return data.ruleset;
    const needsRuleset = Boolean(
      data.abilityScoreAlternativeGroupId
      || (data.multiclass && data.multiclass.requirements)
    );
    if (!needsRuleset) return undefined;

    const characterClass = await this.characterClassRepository.getById(data.id);
    return characterClass?.ruleset;
  }

  private async assertAbilityScoreAlternativeGroup(
    ruleset: string | undefined,
    groupId?: string | null
  ): Promise<void> {
    if (!groupId) return;
    if (!ruleset) {
      throw new ValidationError("No se puede validar el grupo de opciones sin un sistema");
    }

    const group = await this.optionGroupService.getById(groupId);
    if (!group) {
      throw new ValidationError("Grupo de opciones no encontrado");
    }

    const catalog = await this.optionGroupService.getBySystems([ruleset]);
    if (!catalog.some(item => item.id === groupId)) {
      throw new ValidationError("El grupo de opciones no pertenece a este sistema ni a sus ancestros");
    }
  }

  private async assertAttributeKeys(
    ruleset: string | undefined,
    requirements?: AttributeRequirementsCreate | null
  ): Promise<void> {
    const keys = requirements?.attributes?.map(attribute => attribute.key).filter(Boolean) ?? [];
    if (keys.length === 0 || !ruleset) return;

    const attributes = await this.attributeService.getBySystems([ruleset]);
    const existingKeys = new Set(attributes.map(attribute => attribute.key));
    const missingKeys = keys.filter(key => !existingKeys.has(key));

    if (missingKeys.length > 0) {
      throw new ValidationError(`Claves de atributo desconocidas para este sistema: ${missingKeys.join(", ")}`);
    }
  }
}
