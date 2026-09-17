import IFeatRepository from "../repositories/IFeatRepository";
import AttributeService from "./attribute.service";
import { ChoiceApi } from "../types";
import { FeatApi, FeatRequirementsCreate, InputCreateFeat, InputUpdateFeat } from "../types/feat.types";
import { ValidationError } from "../errors/AppError";

export default class FeatService {
  constructor(
    private readonly featRepository: IFeatRepository,
    private readonly attributeService: AttributeService
  ) { }

  async create(data: InputCreateFeat): Promise<FeatApi> {
    await this.assertAttributeKeys(data.ruleset, data.requirements);
    return this.featRepository.create(data);
  }

  async update(data: InputUpdateFeat): Promise<FeatApi> {
    await this.assertAttributeKeys(await this.resolveUpdateRuleset(data), data.requirements);
    return this.featRepository.update(data);
  }

  getById(id: string): Promise<FeatApi | null> {
    return this.featRepository.getById(id);
  }

  getBySystems(rulesets: string[], userId?: string): Promise<FeatApi[]> {
    return this.featRepository.getBySystems(rulesets, userId);
  }

  getAll(): Promise<FeatApi[]> {
    return this.featRepository.getAll();
  }

  getFeatsByIds(ids: string[]): Promise<FeatApi[]> {
    return this.featRepository.getFeatsByIds(ids);
  }

  formatFeatChoices(count: number | undefined, ruleset?: string): Promise<ChoiceApi<FeatApi> | undefined> {
    return this.featRepository.formatFeatChoices(count, ruleset);
  }

  softDelete(id: string): Promise<void> {
    return this.featRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.featRepository.restore(id);
  }

  private async resolveUpdateRuleset(data: InputUpdateFeat): Promise<string | undefined> {
    if (data.ruleset) return data.ruleset;
    if (data.requirements === undefined || data.requirements === null) return undefined;

    const feat = await this.featRepository.getById(data.id);
    return feat?.ruleset;
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
      throw new ValidationError(`Unknown attribute keys for this ruleset: ${missingKeys.join(", ")}`);
    }
  }
}
