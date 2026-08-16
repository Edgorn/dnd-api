import IBackgroundRepository from '../../../../domain/repositories/IBackgroundRepository';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import { mapStringArrayToLabelValue } from '../../../../utils/formatters';
import BackgroundModel from '../schemas/Background';
import {
  BackgroundApi,
  BackgroundMongo,
  InputCreateBackground,
  InputUpdateBackground,
  OptionsNameApi,
  OptionsNameMongo,
  VariantApi,
  VariantMongo
} from '../../../../domain/types/background.types';
import { MixedChoicesApi, MixedChoicesMongo } from '../../../../domain/types';
import { NotFoundError } from '../../../../domain/errors/AppError';

export default class BackgroundRepository implements IBackgroundRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly equipamientoRepository: IEquipamientoRepository,
    private readonly traitRepository: ITraitRepository
  ) { }

  async getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<BackgroundApi[]> {
    try {
      const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
      const query: any = { ruleset: { $in: expandedRulesets } };
      if (!includeDeleted) {
        query.deletedAt = null;
      }
      const backgrounds = await BackgroundModel.find(query)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 })
        .lean<BackgroundMongo[]>();

      return this.formatearBackgrounds(backgrounds);
    } catch (error) {
      console.error("Error obteniendo transfondos/backgrounds:", error);
      throw new Error("No se pudieron obtener los trasfondos");
    }
  }

  async getById(id: string): Promise<BackgroundApi | null> {
    const doc = await BackgroundModel.findById(id).lean<BackgroundMongo>();
    if (!doc) return null;
    return this.formatearBackground(doc);
  }

  async create(data: InputCreateBackground): Promise<BackgroundApi> {
    const newBackground = new BackgroundModel({
      ruleset: data.ruleset,
      name: data.name,
      description: data.description || [],
      img: data.img || "",
      god: data.god ?? false,
      traits: data.traits ?? [],
      traits_data: data.traits_data ?? {},
      language_choices: data.language_choices ?? undefined
    });

    await newBackground.save();
    return this.formatearBackground(newBackground);
  }

  async update(data: InputUpdateBackground): Promise<BackgroundApi> {
    const { id, ...updateFields } = data;
    const updatedBackground = await BackgroundModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedBackground) {
      throw new NotFoundError(`No se encontró el trasfondo con id: ${id}`);
    }

    return this.formatearBackground(updatedBackground);
  }

  async softDelete(id: string): Promise<void> {
    await BackgroundModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await BackgroundModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  private formatearBackgrounds(backgrounds: BackgroundMongo[]): Promise<BackgroundApi[]> {
    return Promise.all(backgrounds.map(b => this.formatearBackground(b)));
  }

  private async formatearBackground(background: BackgroundMongo): Promise<BackgroundApi> {
    const options_name = this.formatearOptionsName(background?.options_name);

    const [
      traits,
      skills,
      language_choices,
      proficiencies,
      proficiencies_choices,
      equipment,
      equipment_choices,
      variants
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(background?.traits ?? [], background?.traits_data),
      this.skillRepository.getSkillsByKeys(background?.skills ?? []),
      this.languageRepository.formatLanguageChoices(background?.language_choices, background?.ruleset),
      this.proficiencyRepository.getProficienciesByIndices(background?.proficiencies ?? []),
      this.proficiencyRepository.formatProficiencyChoices(background?.proficiencies_choices),
      this.equipamientoRepository.obtenerEquipamientosPersonajePorIndices(background?.equipment),
      this.equipamientoRepository.formatearOpcionesDeEquipamientos(background?.equipment_choices),
      this.formatearVariants(background?.variants ?? [])
    ]);

    return {
      id: background._id ? background._id.toString() : "",
      ruleset: background.ruleset || "",
      deletedAt: background.deletedAt,
      name: background.name,
      img: background.img || "",
      description: background.description ?? [],
      traits,
      traits_data: background?.traits_data,
      skills,
      language_choices,
      proficiencies,
      proficiencies_choices,
      equipment,
      equipment_choices,
      personalized_equipment: background.personalized_equipment ?? [],
      money: background.money ?? { quantity: 0, unit: "gp" },
      god: background?.god ?? false,
      options_name,
      personality_traits: mapStringArrayToLabelValue(background?.personality_traits ?? []),
      ideals: mapStringArrayToLabelValue(background?.ideals ?? []),
      bonds: mapStringArrayToLabelValue(background?.bonds ?? []),
      flaws: mapStringArrayToLabelValue(background?.flaws ?? []),
      variants
    };
  }

  private async formatearVariants(variants: VariantMongo[]): Promise<VariantApi[]> {
    const formateadas = await Promise.all(variants.map(v => this.formatearVariant(v)));

    return formateadas.sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }

  private async formatearVariant(variant: VariantMongo): Promise<VariantApi> {
    const options_name = this.formatearOptionsName(variant?.options_name);

    const [
      traits,
      proficiencies_choices,
      mixed_choices,
      equipment,
      equipment_choices
    ] = await Promise.all([
      variant?.traits
        ? this.traitRepository.getTraitsByIndexes(variant?.traits ?? [], variant?.traits_data)
        : Promise.resolve(undefined),
      this.proficiencyRepository.formatProficiencyChoices(variant?.proficiencies_choices),
      this.formatearMixedChoices(variant.mixed_choices),
      this.equipamientoRepository.obtenerEquipamientosPersonajePorIndices(variant?.equipment),
      this.equipamientoRepository.formatearOpcionesDeEquipamientos(variant?.equipment_choices)
    ]);

    return {
      name: variant.name,
      description: variant.description,
      traits,
      traits_data: variant?.traits_data,
      proficiencies_choices,
      mixed_choices,
      personalized_equipment: variant.personalized_equipment ?? [],
      equipment,
      equipment_choices,
      options_name
    };
  }

  private formatearOptionsName(options_name: OptionsNameMongo | undefined): OptionsNameApi | undefined {
    return options_name ? {
      name: options_name.name ?? '',
      choose: options_name.choose ?? 1,
      options: options_name.options?.map(opt => ({ label: opt, value: opt })) ?? []
    } : undefined;
  }

  private async formatearMixedChoices(mixedChoices: MixedChoicesMongo[][] | undefined): Promise<MixedChoicesApi[][] | undefined> {
    if (!mixedChoices) return undefined;

    const results = await Promise.all(mixedChoices.map(mixedChoice => this.formatearMixedChoice(mixedChoice)));

    return results.filter((r): r is MixedChoicesApi[] => r !== undefined);
  }

  private async formatearMixedChoice(mixedChoices: MixedChoicesMongo[] | undefined): Promise<MixedChoicesApi[] | undefined> {
    if (!mixedChoices) return undefined;

    const results = await Promise.all(mixedChoices.map(async (mixedChoice) => {
      if (mixedChoice.type === "proficiency") {
        const competencia = await this.proficiencyRepository.getProficiencyById(mixedChoice.value);
        if (competencia) {
          return {
            type: "proficiency",
            value: competencia
          };
        }
      } else if (mixedChoice.type === "choice") {
        if (mixedChoice.value === "language_choices" && mixedChoice.language_choices) {
          const idiomas = await this.languageRepository.formatLanguageChoices(mixedChoice.language_choices);
          if (idiomas) {
            return {
              type: "choice",
              value: "language_choices",
              language_choices: idiomas
            };
          }
        } else if (mixedChoice.value === "proficiencies_choices" && mixedChoice.proficiencies_choices) {
          const competenciasChoices = await this.proficiencyRepository.formatProficiencyChoices(mixedChoice.proficiencies_choices);
          if (competenciasChoices) {
            return {
              type: "choice",
              value: "proficiencies_choices",
              proficiencies_choices: competenciasChoices
            };
          }
        }
      }

      return undefined;
    }));

    return results.filter((r): r is MixedChoicesApi => r !== undefined);
  }
}
