import { Types } from 'mongoose';
import IBackgroundRepository from '../../../../domain/repositories/IBackgroundRepository';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import ICoinRepository from '../../../../domain/repositories/ICoinRepository';
import BackgroundModel from '../schemas/Background';
import {
  BackgroundApi,
  BackgroundMongo,
  BackgroundTable,
  InputCreateBackground,
  InputUpdateBackground
} from '../../../../domain/types/background.types';
import { CoinApi } from '../../../../domain/types/coin.types';
import { EquipmentApi, EquipmentOptionsMongo, EquipmentChoiceMongo, ResolvedEquipmentChoiceApi } from '../../../../domain/types/equipment.types';
import { NotFoundError } from '../../../../domain/errors/AppError';
import {
  BACKGROUND_OVERLAY_FIELDS,
  mergeBackgroundVariant
} from '../../../../utils/mergeBackgroundVariant';

interface FormatOptions {
  nestVariants?: boolean;
  allowedRulesets?: string[];
}

export default class BackgroundRepository implements IBackgroundRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly equipmentRepository: IEquipmentRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly coinRepository: ICoinRepository
  ) { }

  async getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<BackgroundApi[]> {
    try {
      const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
      const query: Record<string, unknown> = {
        ruleset: { $in: expandedRulesets },
        parentId: null
      };
      if (!includeDeleted) {
        query.deletedAt = null;
      }
      const backgrounds = await BackgroundModel.find(query)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 })
        .lean<BackgroundMongo[]>();

      return this.formatearBackgrounds(backgrounds, {
        nestVariants: true,
        allowedRulesets: expandedRulesets
      });
    } catch (error) {
      console.error("Error obteniendo transfondos/backgrounds:", error);
      throw new Error("No se pudieron obtener los trasfondos");
    }
  }

  async getById(id: string): Promise<BackgroundApi | null> {
    const doc = await BackgroundModel.findById(id).lean<BackgroundMongo>();
    if (!doc) return null;
    return this.formatearBackground(doc, { nestVariants: !this.hasParent(doc) });
  }

  async create(data: InputCreateBackground): Promise<BackgroundApi> {
    const isVariant = Boolean(data.parentId);
    const payload = isVariant
      ? this.buildVariantWritePayload(data)
      : this.buildRootCreatePayload(data);

    const newBackground = new BackgroundModel(payload);
    await newBackground.save();

    if (isVariant) {
      await this.unsetMissingOverlayFields(newBackground._id, payload);
    }

    const saved = await BackgroundModel.findById(newBackground._id).lean<BackgroundMongo>();
    if (!saved) {
      throw new NotFoundError("No se pudo leer el trasfondo creado");
    }
    return this.formatearBackground(saved, { nestVariants: !isVariant });
  }

  async update(data: InputUpdateBackground): Promise<BackgroundApi> {
    const existing = await BackgroundModel.findById(data.id).lean<BackgroundMongo>();
    if (!existing) {
      throw new NotFoundError(`No se encontró el trasfondo con id: ${data.id}`);
    }

    const isVariant = Boolean(data.parentId ?? existing.parentId);
    const { $set, $unset } = isVariant
      ? this.buildVariantUpdateOperators(data)
      : this.buildRootUpdateOperators(data);

    const updateQuery: Record<string, unknown> = {};
    if (Object.keys($set).length > 0) updateQuery.$set = $set;
    if (Object.keys($unset).length > 0) updateQuery.$unset = $unset;

    if (Object.keys(updateQuery).length > 0) {
      await BackgroundModel.findByIdAndUpdate(data.id, updateQuery);
    }

    const updated = await BackgroundModel.findById(data.id).lean<BackgroundMongo>();
    if (!updated) {
      throw new NotFoundError(`No se encontró el trasfondo con id: ${data.id}`);
    }

    return this.formatearBackground(updated, { nestVariants: !this.hasParent(updated) });
  }

  async softDelete(id: string): Promise<void> {
    await BackgroundModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await BackgroundModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  private buildRootCreatePayload(data: InputCreateBackground): Record<string, unknown> {
    return {
      ruleset: data.ruleset,
      name: data.name,
      parentId: null,
      description: data.description || [],
      img: data.img || "",
      god: data.god ?? false,
      traits: data.traits ?? [],
      traits_choices: data.traits_choices ?? [],
      traits_data: data.traits_data ?? {},
      skills: data.skills ?? [],
      language_choices: data.language_choices ?? undefined,
      proficiencies: data.proficiencies ?? [],
      proficiencies_choices: data.proficiencies_choices ?? undefined,
      personality_traits: data.personality_traits ?? [],
      tables: data.tables ?? [],
      ideals: data.ideals ?? [],
      bonds: data.bonds ?? [],
      flaws: data.flaws ?? [],
      money: data.money ?? [],
      equipment_choices: data.equipment_choices ?? undefined,
      equipment: data.equipment ?? []
    };
  }

  private buildVariantWritePayload(data: InputCreateBackground): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      ruleset: data.ruleset,
      name: data.name,
      parentId: this.toObjectId(data.parentId)
    };

    for (const key of BACKGROUND_OVERLAY_FIELDS) {
      if (key === "name") continue;
      const value = data[key as keyof InputCreateBackground];
      if (value !== undefined && value !== null) {
        payload[key] = value;
      }
    }

    return payload;
  }

  private async unsetMissingOverlayFields(
    id: unknown,
    payload: Record<string, unknown>
  ): Promise<void> {
    const $unset: Record<string, 1> = {};
    for (const key of BACKGROUND_OVERLAY_FIELDS) {
      if (!(key in payload) || payload[key] === undefined) {
        $unset[key] = 1;
      }
    }
    if (Object.keys($unset).length === 0) return;
    await BackgroundModel.updateOne({ _id: id }, { $unset });
  }

  private buildRootUpdateOperators(data: InputUpdateBackground): {
    $set: Record<string, unknown>;
    $unset: Record<string, 1>;
  } {
    const { id: _id, ...updateFields } = data;
    const fields = { ...updateFields } as Record<string, unknown>;

    if (fields.equipment_choices === null) fields.equipment_choices = [];
    if (fields.equipment === null) fields.equipment = [];
    if (fields.proficiencies === null) fields.proficiencies = [];
    if (fields.proficiencies_choices === null) fields.proficiencies_choices = [];
    if (fields.traits_choices === null) fields.traits_choices = [];
    if (fields.tables === null) fields.tables = [];
    if (fields.parentId === undefined) {
      delete fields.parentId;
    } else {
      fields.parentId = this.toObjectId(fields.parentId as string | null);
    }

    const $set: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) $set[key] = value;
    }

    return { $set, $unset: {} };
  }

  private buildVariantUpdateOperators(data: InputUpdateBackground): {
    $set: Record<string, unknown>;
    $unset: Record<string, 1>;
  } {
    const { id: _id, ...updateFields } = data;
    const fields = updateFields as Record<string, unknown>;
    const $set: Record<string, unknown> = {};
    const $unset: Record<string, 1> = {};

    if (fields.ruleset !== undefined) $set.ruleset = fields.ruleset;
    if (fields.parentId !== undefined) {
      $set.parentId = this.toObjectId(fields.parentId as string | null);
    }

    for (const key of BACKGROUND_OVERLAY_FIELDS) {
      if (!(key in fields) || fields[key] === undefined) {
        continue;
      }
      const value = fields[key];
      if (value === null) {
        $unset[key] = 1;
      } else {
        $set[key] = value;
      }
    }

    return { $set, $unset };
  }

  private toObjectId(id: string | null | undefined): Types.ObjectId | null {
    if (!id) return null;
    return new Types.ObjectId(id);
  }

  private hasParent(background: BackgroundMongo): boolean {
    return background.parentId != null && background.parentId !== "";
  }

  private parentIdToString(parentId: unknown): string | null {
    if (parentId == null || parentId === "") return null;
    return parentId.toString();
  }

  private formatearBackgrounds(
    backgrounds: BackgroundMongo[],
    options?: FormatOptions
  ): Promise<BackgroundApi[]> {
    return Promise.all(backgrounds.map(b => this.formatearBackground(b, options)));
  }

  private async formatearBackground(
    background: BackgroundMongo,
    options?: FormatOptions
  ): Promise<BackgroundApi> {
    if (this.hasParent(background)) {
      return this.formatearVariantDocument(background);
    }

    const formatted = await this.hydrateBackground(background);
    formatted.parentId = null;
    formatted.variants = options?.nestVariants
      ? await this.formatearChildVariants(background, options.allowedRulesets)
      : [];
    return formatted;
  }

  private async formatearVariantDocument(background: BackgroundMongo): Promise<BackgroundApi> {
    const parent = await BackgroundModel.findById(background.parentId).lean<BackgroundMongo>();
    const overlay = parent ? mergeBackgroundVariant(parent, background) : undefined;
    const source = overlay
      ? this.applyOverlayIdentity(overlay.merged, background)
      : background;
    const overriddenFields = overlay?.overriddenFields;

    const formatted = await this.hydrateBackground(source);
    formatted.parentId = this.parentIdToString(background.parentId);
    formatted.variants = [];
    if (overriddenFields && overriddenFields.length > 0) {
      formatted.overriddenFields = overriddenFields;
    }
    return formatted;
  }

  private applyOverlayIdentity(merged: BackgroundMongo, child: BackgroundMongo): BackgroundMongo {
    return {
      ...merged,
      _id: child._id,
      ruleset: child.ruleset,
      parentId: child.parentId,
      deletedAt: child.deletedAt
    };
  }

  private async formatearChildVariants(
    parent: BackgroundMongo,
    allowedRulesets?: string[]
  ): Promise<BackgroundApi[]> {
    if (!parent._id) return [];

    const childQuery: { parentId: unknown; deletedAt: null; ruleset?: { $in: string[] } } = {
      parentId: parent._id,
      deletedAt: null
    };
    if (allowedRulesets) {
      childQuery.ruleset = { $in: allowedRulesets };
    }

    const children = await BackgroundModel.find(childQuery).lean<BackgroundMongo[]>();
    const formatted = await Promise.all(
      children.map(child => this.formatearVariantDocument(child))
    );

    return formatted.sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }

  private async hydrateBackground(background: BackgroundMongo): Promise<BackgroundApi> {
    const tables = this.resolveTables(background);

    let rawMoney: { quantity?: number; unit?: string }[] = [];
    if (Array.isArray(background?.money)) {
      rawMoney = background.money;
    } else if (background?.money && typeof background.money === 'object') {
      rawMoney = [background.money];
    }

    const coinUnits = rawMoney.map(m => m?.unit).filter((unit): unit is string => Boolean(unit));

    const [
      traits,
      traits_choices,
      skills,
      language_choices,
      proficiencies,
      proficiencies_choices,
      equipment,
      equipment_choices,
      coins
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(background?.traits ?? [], background?.traits_data),
      this.traitRepository.formatTraitChoices(background?.traits_choices),
      this.skillRepository.getSkillsByIds(background?.skills ?? []),
      this.languageRepository.formatLanguageChoices(background?.language_choices, background?.ruleset),
      this.proficiencyRepository.getProficienciesByIndices(background?.proficiencies ?? []),
      this.proficiencyRepository.formatProficiencyChoices(background?.proficiencies_choices),
      this.equipmentRepository.getCharacterEquipmentsByIds(background?.equipment),
      this.formatBackgroundEquipmentChoices(background?.equipment_choices, background?.ruleset),
      this.coinRepository.getCoinsByIds(coinUnits)
    ]);

    const money = rawMoney.map(m => {
      const coin = coins.find(c => c.id === m.unit);
      if (coin) {
        return {
          quantity: m.quantity ?? 0,
          ...coin
        };
      }
      return null;
    }).filter(Boolean) as ({ quantity: number } & CoinApi)[];

    return {
      id: background._id ? background._id.toString() : "",
      ruleset: background.ruleset || "",
      deletedAt: background.deletedAt,
      parentId: this.parentIdToString(background.parentId),
      name: background.name,
      img: background.img || "",
      description: background.description ?? [],
      traits,
      traits_choices,
      traits_data: background?.traits_data,
      skills,
      language_choices,
      proficiencies,
      proficiencies_choices,
      equipment,
      equipment_choices,
      money,
      god: background?.god ?? false,
      tables,
      personality_traits: background?.personality_traits ?? [],
      ideals: background?.ideals ?? [],
      bonds: background?.bonds ?? [],
      flaws: background?.flaws ?? [],
      variants: []
    };
  }

  private resolveTables(background: BackgroundMongo): BackgroundTable[] {
    const stored = background.tables;
    if (Array.isArray(stored) && stored.length > 0) {
      return stored;
    }
    return [];
  }

  private async formatBackgroundEquipmentChoices(
    rawChoices: unknown,
    ruleset: string
  ): Promise<ResolvedEquipmentChoiceApi[] | undefined> {
    if (!rawChoices || !Array.isArray(rawChoices) || rawChoices.length === 0) {
      return undefined;
    }

    if (Array.isArray(rawChoices[0])) {
      const legacyFormatted = await this.equipmentRepository.formatEquipmentChoices(
        rawChoices as EquipmentOptionsMongo[][]
      );

      if (!legacyFormatted) return undefined;

      return legacyFormatted.map(group => ({
        choose: group[0]?.choose ?? 1,
        options: group.flatMap(item => item.options) as EquipmentApi[],
        query_type: "options" as const
      }));
    }

    return this.equipmentRepository.formatEquipmentItemChoices(
      rawChoices as EquipmentChoiceMongo[],
      ruleset
    );
  }
}
