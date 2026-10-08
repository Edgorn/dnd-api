import ICharacterClassRepository from "../repositories/ICharacterClassRepository";
import {
  CharacterClassApi,
  CharacterClassMulticlassCreate,
  InputCreateCharacterClass,
  InputUpdateCharacterClass
} from "../types/characterClass.types";
import { FeatRequirementsCreate } from "../types/feat.types";
import { ValidationError } from "../errors/AppError";
import AttributeService from "./attribute.service";

export default class CharacterClassService {
  constructor(
    private readonly characterClassRepository: ICharacterClassRepository,
    private readonly attributeService: AttributeService
  ) { }

  getBySystems(rulesets: string[]): Promise<CharacterClassApi[]> {
    return this.characterClassRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<CharacterClassApi | null> {
    return this.characterClassRepository.getById(id);
  }

  async create(data: InputCreateCharacterClass): Promise<CharacterClassApi> {
    await this.assertAttributeKeys(data.ruleset, data.multiclass?.requirements);
    return this.characterClassRepository.create(data);
  }

  async update(data: InputUpdateCharacterClass): Promise<CharacterClassApi> {
    await this.assertAttributeKeys(
      await this.resolveUpdateRuleset(data),
      data.multiclass === null ? undefined : data.multiclass?.requirements
    );
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
    if (data.multiclass === undefined || data.multiclass === null) return undefined;
    if (!data.multiclass.requirements) return undefined;

    const characterClass = await this.characterClassRepository.getById(data.id);
    return characterClass?.ruleset;
  }

  private async assertAttributeKeys(
    ruleset: string | undefined,
    requirements?: FeatRequirementsCreate | null
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
