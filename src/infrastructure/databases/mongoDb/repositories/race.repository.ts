import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import SkillService from '../../../../domain/services/skill.service';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IRaceRepository, { RaceSummarySubtree } from '../../../../domain/repositories/IRaceRepository';
import AttributeService from '../../../../domain/services/attribute.service';
import {
  CreateRace,
  RaceApi,
  RaceCatalogItem,
  RaceChoiceCount,
  RaceLevelMongo,
  RaceMongo,
  RaceRef,
  RaceSummaryDraft,
  SubracesApi,
  UpdateRace,
  VariantApi,
  VariantMongo
} from '../../../../domain/types/race.types';
import { AttributeApi, AttributeBonus, AttributeBonusCreate } from '../../../../domain/types/attribute.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import RaceModel from '../schemas/Race';
import IFeatRepository from '../../../../domain/repositories/IFeatRepository';
import { TraitDataMongo } from '../../../../domain/types/traits.types';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import ICreatureTypeRepository from '../../../../domain/repositories/ICreatureTypeRepository';
import { CreatureTypeApi } from '../../../../domain/types/creatureType.types';
import { Types } from 'mongoose';
import { mergeRaceLevelRows } from '../../../../utils/characterLevelUpTraits';
import { collectCatalogLanguageIds, hydrateLanguageGrants, languageApiById } from '../../../../utils/hydrateLanguageGrants';

type RaceAncestryDoc = Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">;
type RaceRefDoc = Pick<RaceMongo, "_id" | "name" | "ruleset" | "creatureTypeId" | "parentId">;
type RaceSummaryDoc = Pick<
  RaceMongo,
  | "_id"
  | "name"
  | "description"
  | "img"
  | "alignment"
  | "ruleset"
  | "parentId"
  | "subraces_name"
  | "size"
  | "speed"
  | "creatureTypeId"
  | "ability_bonuses"
  | "ability_bonus_choices"
  | "skill_choices"
  | "playable"
>;

export default class RaceRepository implements IRaceRepository {
  constructor(
    private readonly languageRepository: ILanguageRepository,
    private readonly spellRepository: ISpellRepository,
    private readonly skillService: SkillService,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly featRepository: IFeatRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly attributeService: AttributeService,
    private readonly equipmentRepository: IEquipmentRepository,
    private readonly creatureTypeRepository: ICreatureTypeRepository,
    private readonly systemRepository?: ISystemRepository
  ) { }

  async getAll(playable?: boolean): Promise<RaceApi[]> {
    try {
      const races = await RaceModel.find({ parentId: null, deletedAt: null, ...this.playableCondition(playable) })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      return this.formatRaces(races, undefined, playable);
    } catch (error) {
      console.error("Error getting races:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  async getBySystem(ruleset: string, playable?: boolean): Promise<RaceApi[]> {
    try {
      const expandedRulesets = await this.expandRulesets(ruleset);
      const races = await RaceModel.find({
        ruleset: { $in: expandedRulesets },
        parentId: null,
        deletedAt: null,
        ...this.playableCondition(playable)
      })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      return this.formatRaces(races, expandedRulesets, playable);
    } catch (error) {
      console.error("Error getting races:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  async getById(id: string, allowedRulesets?: string[]): Promise<RaceApi | undefined> {
    try {
      const race = await RaceModel.findById(id).exec();
      if (!race || race.deletedAt) return undefined;
      return this.formatRace(race, allowedRulesets, undefined, "none");
    } catch (error) {
      console.error("Error getting race by id:", error);
      throw new Error("No se pudo obtener la raza");
    }
  }

  async getSummaries(ruleset?: string, playable?: boolean): Promise<RaceSummaryDraft[]> {
    const docs = await this.findSummaryDocs(ruleset, playable);
    return this.buildSummaryForest(docs);
  }

  async getSummarySubtree(parentId: string, ruleset?: string): Promise<RaceSummarySubtree | undefined> {
    const docs = await this.findSummaryDocs(ruleset);
    const forest = await this.buildSummaryForest(docs);
    const parent = this.findSummaryDraft(forest, parentId);
    if (!parent?.subraces?.list.length) return undefined;
    return parent.subraces;
  }

  async getCatalog(ruleset?: string, playable?: boolean): Promise<RaceCatalogItem[]> {
    const filter: Record<string, unknown> = {
      deletedAt: null,
      ...this.playableCondition(playable)
    };
    if (ruleset) {
      filter.ruleset = { $in: await this.expandRulesets(ruleset) };
    }

    const docs = await RaceModel.find(filter)
      .select("_id name ruleset creatureTypeId parentId")
      .lean<RaceRefDoc[]>();

    return this.mapRaceRefs(docs);
  }

  async create(race: CreateRace): Promise<RaceApi> {
    const created = new RaceModel({
      ...(race.id ? { _id: race.id } : {}),
      name: race.name,
      description: race.description ?? [],
      alignment: race.alignment,
      img: race.img,
      ability_bonuses: race.ability_bonuses,
      ability_bonus_choices: race.ability_bonus_choices ?? undefined,
      skill_choices: race.skill_choices ?? undefined,
      age: race.age,
      size: race.size,
      size_range: race.size_range,
      weight_range: race.weight_range,
      speed: race.speed,
      ruleset: race.ruleset,
      traits: race.traits,
      traits_data: race.traits_data,
      languages: race.languages,
      language_choices: race.language_choices,
      parentId: race.parentId || null,
      subraces_name: race.subraces_name,
      proficiencies_choices: race.proficiencies_choices,
      spell_choices: race.spell_choices,
      spellcasting: race.spellcasting || null,
      equipment: race.equipment ?? [],
      creatureTypeId: race.creatureTypeId || null,
      playable: race.playable ?? true,
      levels: race.levels ?? []
    })

    await created.save()

    return this.formatRace(created, undefined, undefined, "none")
  }

  async update(race: UpdateRace): Promise<RaceApi | undefined> {
    try {
      if (!race.id) {
        throw new Error("No se proporciono el id de la raza");
      }

      const update = {
        name: race.name,
        description: race.description,
        alignment: race.alignment,
        img: race.img,
        ability_bonuses: race.ability_bonuses,
        age: race.age,
        size: race.size,
        size_range: race.size_range,
        weight_range: race.weight_range,
        speed: race.speed,
        ruleset: race.ruleset,
        traits: race.traits,
        traits_data: race.traits_data,
        languages: race.languages,
        language_choices: race.language_choices,
        parentId: race.parentId,
        subraces_name: race.subraces_name,
        proficiencies_choices: race.proficiencies_choices === null ? [] : race.proficiencies_choices,
        spell_choices: race.spell_choices === null ? [] : race.spell_choices,
        spellcasting: race.spellcasting,
        ...(race.equipment !== undefined ? { equipment: race.equipment === null ? [] : race.equipment } : {}),
        ...(race.creatureTypeId !== undefined ? { creatureTypeId: race.creatureTypeId || null } : {}),
        ...(race.playable !== undefined ? { playable: race.playable } : {}),
        ...(race.levels !== undefined ? { levels: race.levels ?? [] } : {}),
        ...(race.ability_bonus_choices !== undefined
          ? { ability_bonus_choices: race.ability_bonus_choices ?? undefined }
          : {}),
        ...(race.skill_choices !== undefined
          ? { skill_choices: race.skill_choices ?? undefined }
          : {})
      }

      const updated = await RaceModel.findByIdAndUpdate(
        race.id,
        update,
        { returnDocument: 'after' }
      ).exec();

      return updated ? this.formatRace(updated, undefined, undefined, "none") : undefined
    } catch (error) {
      console.error("Error updating race:", error);
      throw new Error("No se pudo actualizar la raza");
    }
  }

  async softDelete(id: string): Promise<boolean> {
    try {
      const result = await RaceModel.findByIdAndUpdate(id, { deletedAt: new Date() }).exec();
      return !!result;
    } catch (error) {
      console.error("Error doing soft delete of race:", error);
      throw new Error("No se pudo eliminar la raza");
    }
  }

  async restore(id: string): Promise<boolean> {
    try {
      const result = await RaceModel.findByIdAndUpdate(id, { deletedAt: null }).exec();
      return !!result;
    } catch (error) {
      console.error("Error restoring race:", error);
      throw new Error("No se pudo restaurar la raza");
    }
  }

  formatRaces(races: RaceMongo[], allowedRulesets?: string[], playable?: boolean): Promise<RaceApi[]> {
    return Promise.all(races.map(race => this.formatRace(race, allowedRulesets, playable)));
  }

  async formatRace(
    race: RaceMongo,
    allowedRulesets?: string[],
    playable?: boolean,
    subracesMode: "full" | "none" = "full"
  ): Promise<RaceApi> {
    const levels = this.normalizeLevels(race?.levels);
    const dataLevel = levels.find(level => level.level === 1)
    const ruleset = race.ruleset;

    const understandRaw = race?.languages?.understands ?? [];
    const speakRaw = race?.languages?.speaks ?? [];

    const [
      traits, ability_bonuses, ability_bonus_choices, skill_choices, catalogLanguages,
      proficiencies_choices, subraces, variants, spell_choices,
      formattedLanguageChoices, spellcasting, equipment, creatureType
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(race?.traits ?? [], { ...dataLevel?.traits_data, ...race.traits_data }),
      this.attributeService.formatAbilityBonuses(race?.ability_bonuses ?? [], ruleset),
      this.attributeService.formatAbilityBonusChoices(race?.ability_bonus_choices, ruleset),
      this.skillService.formatSkillChoices(race.skill_choices, ruleset),
      this.languageRepository.getByIds(collectCatalogLanguageIds(understandRaw, speakRaw)),
      this.proficiencyRepository.formatProficiencyChoices(race?.proficiencies_choices),
      subracesMode === "full"
        ? this.formatSubraces(race, { ...dataLevel?.traits_data, ...race.traits_data }, allowedRulesets, playable)
        : Promise.resolve(undefined),
      this.formatVariants(race?.variants ?? [], ruleset),
      this.spellRepository.formatSpellChoices(race?.spell_choices),
      this.languageRepository.formatLanguageChoices(race.language_choices, ruleset),
      this.formatRaceSpellcasting(race),
      this.equipmentRepository.getCharacterEquipmentsByIds(race.equipment ?? []),
      this.formatRaceCreatureType(race)
    ])
    const languageCatalog = languageApiById(catalogLanguages);

    return {
      id: race._id.toString(),
      name: race.name,
      description: race.description ?? [],
      alignment: race.alignment,
      img: race.img,
      ruleset: race.ruleset,
      speed: typeof race.speed === 'number' ? { walk: race.speed } : (race.speed ?? { walk: 30 }),
      size: race.size,
      size_range: race.size_range,
      weight_range: race.weight_range,
      age: race.age,
      ability_bonuses,
      ability_bonus_choices,
      skill_choices,
      traits,
      traits_data: { ...dataLevel?.traits_data, ...race.traits_data },
      languages: {
        understands: hydrateLanguageGrants(understandRaw, languageCatalog),
        speaks: hydrateLanguageGrants(speakRaw, languageCatalog),
        notes: race?.languages?.notes ?? ""
      },
      language_choices: formattedLanguageChoices,
      proficiencies_choices,
      subraces,
      parentId: race.parentId ? race.parentId.toString() : null,
      variants,
      spell_choices,
      spellcasting: spellcasting ?? undefined,
      creatureType: creatureType ?? undefined,
      playable: race.playable !== false,
      equipment: equipment ?? [],
      ...(Array.isArray(race.levels) ? { levels } : {})
    };
  }

  async formatSubraces(
    race: RaceMongo,
    _traitsData?: TraitDataMongo,
    allowedRulesets?: string[],
    playable?: boolean
  ): Promise<SubracesApi | undefined> {
    const childQuery: {
      parentId: RaceMongo["_id"];
      deletedAt: null;
      ruleset?: { $in: string[] };
      playable?: false | { $ne: false };
    } = {
      parentId: race._id,
      deletedAt: null,
      ...this.playableCondition(playable),
    };
    if (allowedRulesets) {
      childQuery.ruleset = { $in: allowedRulesets };
    }

    const childRaces = await RaceModel.find(childQuery);
    if (childRaces.length === 0) return undefined;

    const formatted = await Promise.all(childRaces.map(child => this.formatRace(child, allowedRulesets, playable)));

    return {
      name: race.subraces_name ?? 'Subrazas',
      list: ordenarPorNombre(formatted)
    };
  }

  async formatVariants(variants: VariantMongo[], ruleset?: string): Promise<VariantApi[]> {
    const formatted = await Promise.all(variants.map(variant => this.formatVariant(variant, ruleset)))
    return ordenarPorNombre(formatted);
  }

  async formatVariant(variant: VariantMongo, ruleset?: string): Promise<VariantApi> {
    const [skill_choices, feats, ability_bonuses, ability_bonus_choices] = await Promise.all([
      ruleset ? this.skillService.formatSkillChoices(variant?.skill_choices, ruleset) : Promise.resolve(undefined),
      this.featRepository.formatFeatChoices(variant.feats ?? variant.dotes, ruleset),
      ruleset ? this.attributeService.formatAbilityBonuses(variant?.ability_bonuses ?? [], ruleset) : Promise.resolve([]),
      ruleset ? this.attributeService.formatAbilityBonusChoices(variant?.ability_bonus_choices, ruleset) : Promise.resolve(undefined)
    ])

    return {
      name: variant.name,
      ability_bonuses,
      ability_bonus_choices,
      skill_choices,
      feats
    }
  }

  async getLevelUpData(raceId: string, level: number): Promise<RaceLevelMongo | undefined> {
    const chain = await this.ancestryIncludingSelf(raceId);
    if (!chain.length) return undefined;

    let merged: RaceLevelMongo | undefined;
    for (const race of chain) {
      const row = this.normalizeLevels(race.levels).find(item => item.level === level);
      if (!row) continue;
      merged = mergeRaceLevelRows(merged, row);
    }
    return merged;
  }

  private async ancestryIncludingSelf(id: string): Promise<RaceMongo[]> {
    const leafToRoot: RaceMongo[] = [];
    const seen = new Set<string>();
    let currentId: string | undefined = id;

    while (currentId && Types.ObjectId.isValid(currentId) && !seen.has(currentId)) {
      seen.add(currentId);
      const found: RaceMongo | null = await RaceModel.findOne({ _id: currentId as any, deletedAt: null })
        .lean<RaceMongo | null>();
      if (!found) break;
      leafToRoot.push(found);
      currentId = this.readParentId(found.parentId);
    }

    return leafToRoot.reverse();
  }

  private readParentId(parentId: RaceMongo["parentId"]): string | undefined {
    if (!parentId) return undefined;
    const value = parentId.toString();
    return value.length > 0 ? value : undefined;
  }

  private normalizeLevels(levels: unknown): RaceLevelMongo[] {
    if (!Array.isArray(levels)) return [];

    const rows: RaceLevelMongo[] = [];
    for (const item of levels) {
      if (!item || typeof item !== "object") continue;
      const level = (item as { level?: unknown }).level;
      if (typeof level !== "number" || !Number.isInteger(level)) continue;

      rows.push({
        level,
        traits_data: this.normalizeTraitData((item as { traits_data?: unknown }).traits_data)
      });
    }
    return rows;
  }

  private normalizeTraitData(value: unknown): TraitDataMongo {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};

    const result: TraitDataMongo = {};
    for (const [traitId, tokens] of Object.entries(value as Record<string, unknown>)) {
      if (!tokens || typeof tokens !== "object" || Array.isArray(tokens)) continue;
      const clean: Record<string, string> = {};
      for (const [token, replacement] of Object.entries(tokens as Record<string, unknown>)) {
        if (typeof replacement === "string") clean[token] = replacement;
      }
      if (Object.keys(clean).length) result[traitId] = clean;
    }
    return result;
  }

  async getSpellcastingAttribute(raceId: string): Promise<AttributeApi | undefined> {
    const race = await RaceModel.findOne({ _id: raceId as any, deletedAt: null })
      .select("_id spellcasting parentId ruleset")
      .lean<Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">>();

    if (!race) return undefined;
    return this.formatRaceSpellcasting(race);
  }

  async getRaceRefsByIds(ids: string[]): Promise<RaceRef[]> {
    const validIds = [...new Set(ids.filter(id => Types.ObjectId.isValid(id)))]
      .map(id => new Types.ObjectId(id));
    if (!validIds.length) return [];

    const races = await RaceModel.find({
      _id: { $in: validIds as any },
      deletedAt: null
    })
      .select("_id name ruleset creatureTypeId parentId")
      .lean<RaceRefDoc[]>();

    return this.mapRaceRefs(races);
  }

  async countRootRacesByRulesets(rulesets: string[]): Promise<Map<string, number>> {
    const uniqueRulesets = [...new Set(rulesets.filter((id) => typeof id === "string" && id.length > 0))];
    if (uniqueRulesets.length === 0) return new Map();

    const grouped = await RaceModel.aggregate<{ _id: string | null; count: number }>([
      {
        $match: {
          parentId: null,
          deletedAt: null,
          ruleset: { $in: uniqueRulesets },
        },
      },
      {
        $group: {
          _id: "$ruleset",
          count: { $sum: 1 },
        },
      },
    ]);

    const counts = new Map<string, number>();
    for (const row of grouped) {
      if (row._id == null || row._id === "") continue;
      counts.set(String(row._id), row.count);
    }
    return counts;
  }

  async getRaceRefsBySystems(rulesets: string[]): Promise<RaceRef[]> {
    const uniqueRulesets = [...new Set(rulesets.filter(id => typeof id === "string" && id.length > 0))];
    if (!uniqueRulesets.length) return [];

    const races = await RaceModel.find({
      ruleset: { $in: uniqueRulesets },
      deletedAt: null
    })
      .select("_id name ruleset creatureTypeId parentId")
      .lean<RaceRefDoc[]>();

    return this.mapRaceRefs(races);
  }

  private async formatRaceSpellcasting(
    race: Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">
  ): Promise<AttributeApi | undefined> {
    const source = await this.resolveInheritedSpellcastingSource(race);
    if (!source) return undefined;
    return this.attributeService.formatSpellcastingAttribute(source.spellcasting, source.ruleset);
  }

  private async resolveInheritedSpellcastingSource(
    race: Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">,
    visited = new Set<string>()
  ): Promise<{ spellcasting: RaceMongo["spellcasting"]; ruleset: string } | undefined> {
    const id = race._id?.toString();
    if (id) {
      if (visited.has(id)) return undefined;
      visited.add(id);
    }

    if (race.spellcasting) {
      return { spellcasting: race.spellcasting, ruleset: race.ruleset };
    }

    if (!race.parentId) return undefined;

    const parent = await RaceModel.findOne({ _id: race.parentId as any, deletedAt: null })
      .select("_id spellcasting parentId ruleset")
      .lean<Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">>();

    if (!parent) return undefined;
    return this.resolveInheritedSpellcastingSource(parent, visited);
  }

  private playableCondition(playable?: boolean): { playable?: false | { $ne: false } } {
    if (playable === true) return { playable: { $ne: false } };
    if (playable === false) return { playable: false };
    return {};
  }

  private async formatRaceCreatureType(
    race: Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">
  ): Promise<CreatureTypeApi | undefined> {
    const typeId = await this.resolveInheritedCreatureTypeId(race);
    if (!typeId) return undefined;

    const creatureType = await this.creatureTypeRepository.getById(typeId);
    if (!creatureType || creatureType.deletedAt) return undefined;
    return creatureType;
  }

  private async resolveInheritedCreatureTypeId(
    race: Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">,
    visited = new Set<string>()
  ): Promise<string | undefined> {
    const id = race._id?.toString();
    if (id) {
      if (visited.has(id)) return undefined;
      visited.add(id);
    }

    if (race.creatureTypeId) {
      return race.creatureTypeId.toString();
    }

    if (!race.parentId) return undefined;

    const parent = await RaceModel.findOne({ _id: race.parentId as any, deletedAt: null })
      .select("_id creatureTypeId parentId")
      .lean<Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">>();

    if (!parent) return undefined;
    return this.resolveInheritedCreatureTypeId(parent, visited);
  }

  private async expandRulesets(ruleset: string): Promise<string[]> {
    return this.systemRepository
      ? await this.systemRepository.getSystemsAndAncestors([ruleset])
      : [ruleset];
  }

  private async buildSummaryForest(docs: RaceSummaryDoc[]): Promise<RaceSummaryDraft[]> {
    if (docs.length === 0) return [];

    const byId = await this.withAncestorRaceDocs(docs);
    const typeIds = this.collectResolvedCreatureTypeIds(docs, byId);
    const creatureTypes = await this.creatureTypeRepository.getByIds([...typeIds]);
    const creatureTypeById = new Map(creatureTypes.map(type => [type.id, type]));
    const attributesByRuleset = await this.loadAttributesByRuleset(docs.map(doc => doc.ruleset));

    const childrenByParent = new Map<string, RaceSummaryDoc[]>();
    const roots: RaceSummaryDoc[] = [];
    for (const doc of docs) {
      const parentId = this.readParentId(doc.parentId);
      if (!parentId) {
        roots.push(doc);
        continue;
      }
      const siblings = childrenByParent.get(parentId) ?? [];
      siblings.push(doc);
      childrenByParent.set(parentId, siblings);
    }

    const mapNode = (doc: RaceSummaryDoc): RaceSummaryDraft => {
      const typeId = this.resolveCreatureTypeIdFromMap(doc, byId);
      const creatureType = typeId ? creatureTypeById.get(typeId) : undefined;
      const children = childrenByParent.get(doc._id.toString()) ?? [];
      const mappedChildren = ordenarPorNombre(children.map(mapNode));
      const choiceAsi = this.choiceCount(doc.ability_bonus_choices);
      const choiceSkill = this.choiceCount(doc.skill_choices);
      const parentId = this.readParentId(doc.parentId);

      return {
        id: doc._id.toString(),
        name: doc.name,
        img: doc.img ?? "",
        description: doc.description ?? [],
        alignment: doc.alignment,
        ruleset: doc.ruleset,
        playable: doc.playable !== false,
        parentId: parentId ?? null,
        size: doc.size,
        speed: this.walkSpeed(doc.speed),
        creatureType: creatureType && !creatureType.deletedAt
          ? { id: creatureType.id, name: creatureType.name }
          : undefined,
        ability_bonuses: this.mapAbilityBonuses(doc.ability_bonuses ?? [], attributesByRuleset.get(doc.ruleset) ?? []),
        ...(choiceAsi ? { ability_bonus_choices: choiceAsi } : {}),
        ...(choiceSkill ? { skill_choices: choiceSkill } : {}),
        ...(mappedChildren.length
          ? { subraces: { name: doc.subraces_name ?? "Subrazas", list: mappedChildren } }
          : {})
      };
    };

    return ordenarPorNombre(roots.map(mapNode));
  }

  private findSummaryDraft(nodes: RaceSummaryDraft[], id: string): RaceSummaryDraft | undefined {
    for (const node of nodes) {
      if (node.id === id) return node;
      const nested = node.subraces?.list.length
        ? this.findSummaryDraft(node.subraces.list, id)
        : undefined;
      if (nested) return nested;
    }
    return undefined;
  }

  private async findSummaryDocs(ruleset?: string, playable?: boolean): Promise<RaceSummaryDoc[]> {
    const filter: Record<string, unknown> = {
      deletedAt: null,
      ...this.playableCondition(playable)
    };
    if (ruleset) {
      filter.ruleset = { $in: await this.expandRulesets(ruleset) };
    }

    return RaceModel.find(filter)
      .select("_id name description img alignment ruleset parentId subraces_name size speed creatureTypeId ability_bonuses ability_bonus_choices skill_choices playable")
      .lean<RaceSummaryDoc[]>();
  }

  private async mapRaceRefs(races: RaceRefDoc[]): Promise<RaceRef[]> {
    const byId = await this.withAncestorRaceDocs(races);
    return races.map(race => ({
      id: race._id.toString(),
      name: race.name,
      ruleset: race.ruleset,
      creatureTypeId: this.resolveCreatureTypeIdFromMap(race, byId) ?? null
    }));
  }

  private async withAncestorRaceDocs<T extends RaceAncestryDoc>(docs: T[]): Promise<Map<string, RaceAncestryDoc>> {
    const byId = new Map<string, RaceAncestryDoc>();
    for (const doc of docs) {
      byId.set(doc._id.toString(), doc);
    }

    let missing = this.missingParentIds(byId);
    while (missing.length) {
      const parents = await RaceModel.find({
        _id: { $in: missing.map(id => new Types.ObjectId(id)) as any },
        deletedAt: null
      })
        .select("_id creatureTypeId parentId")
        .lean<RaceAncestryDoc[]>();

      if (!parents.length) break;
      for (const parent of parents) {
        byId.set(parent._id.toString(), parent);
      }
      missing = this.missingParentIds(byId);
    }

    return byId;
  }

  private missingParentIds(byId: Map<string, RaceAncestryDoc>): string[] {
    const missing: string[] = [];
    for (const doc of byId.values()) {
      const parentId = this.readParentId(doc.parentId);
      if (parentId && !byId.has(parentId) && Types.ObjectId.isValid(parentId)) {
        missing.push(parentId);
      }
    }
    return [...new Set(missing)];
  }

  private collectResolvedCreatureTypeIds(
    docs: RaceAncestryDoc[],
    byId: Map<string, RaceAncestryDoc>
  ): Set<string> {
    const typeIds = new Set<string>();
    for (const doc of docs) {
      const typeId = this.resolveCreatureTypeIdFromMap(doc, byId);
      if (typeId) typeIds.add(typeId);
    }
    return typeIds;
  }

  private resolveCreatureTypeIdFromMap(
    race: RaceAncestryDoc,
    byId: Map<string, RaceAncestryDoc>,
    visited = new Set<string>()
  ): string | undefined {
    const id = race._id.toString();
    if (visited.has(id)) return undefined;
    visited.add(id);

    if (race.creatureTypeId) return race.creatureTypeId.toString();

    const parentId = this.readParentId(race.parentId);
    if (!parentId) return undefined;
    const parent = byId.get(parentId);
    if (!parent) return undefined;
    return this.resolveCreatureTypeIdFromMap(parent, byId, visited);
  }

  private async loadAttributesByRuleset(rulesets: string[]): Promise<Map<string, AttributeApi[]>> {
    const unique = [...new Set(rulesets.filter(Boolean))];
    const entries = await Promise.all(
      unique.map(async ruleset => [ruleset, await this.attributeService.getBySystems([ruleset])] as const)
    );
    return new Map(entries);
  }

  private mapAbilityBonuses(bonuses: AttributeBonusCreate[], attributes: AttributeApi[]): AttributeBonus[] {
    if (!bonuses.length) return [];
    const attributesMap = new Map(attributes.map(attribute => [attribute.key, attribute]));
    return bonuses.map(bonus => {
      const key = bonus.key || "";
      const attribute = attributesMap.get(key);
      return {
        key,
        name: attribute?.name || key,
        bonus: bonus.bonus,
        icon: attribute?.icon
      };
    });
  }

  private choiceCount(choice: RaceMongo["ability_bonus_choices"] | RaceMongo["skill_choices"]): RaceChoiceCount | undefined {
    if (!choice || typeof choice.choose !== "number" || choice.choose < 1) return undefined;
    return { choose: choice.choose };
  }

  private walkSpeed(speed: RaceMongo["speed"] | number | undefined): { walk: number } | undefined {
    if (typeof speed === "number") return { walk: speed };
    if (speed && typeof speed.walk === "number") return { walk: speed.walk };
    return undefined;
  }
}
