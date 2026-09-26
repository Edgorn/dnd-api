import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import SkillService from '../../../../domain/services/skill.service';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IRaceRepository from '../../../../domain/repositories/IRaceRepository';
import AttributeService from '../../../../domain/services/attribute.service';
import { CreateRace, RaceApi, RaceLevelMongo, RaceMongo, RaceRef, SubracesApi, UpdateRace, VarianteApi, VarianteMongo } from '../../../../domain/types/race.types';
import { AttributeApi } from '../../../../domain/types/attribute.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import RaceModel from '../schemas/Race';
import IFeatRepository from '../../../../domain/repositories/IFeatRepository';
import { TraitDataMongo } from '../../../../domain/types/traits.types';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import ICreatureTypeRepository from '../../../../domain/repositories/ICreatureTypeRepository';
import { CreatureTypeApi } from '../../../../domain/types/creatureType.types';
import { Types } from 'mongoose';

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

  async obtenerTodas(playable?: boolean): Promise<RaceApi[]> {
    try {
      const razas = await RaceModel.find({ parentId: null, deletedAt: null, ...this.playableCondition(playable) })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      return this.formatearRazas(razas, undefined, playable);
    } catch (error) {
      console.error("Error obteniendo razas:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  async obtenerPorSistema(ruleset: string, playable?: boolean): Promise<RaceApi[]> {
    try {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors([ruleset])
        : [ruleset];
      const razas = await RaceModel.find({
        ruleset: { $in: expandedRulesets },
        parentId: null,
        deletedAt: null,
        ...this.playableCondition(playable)
      })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      return this.formatearRazas(razas, expandedRulesets, playable);
    } catch (error) {
      console.error("Error obteniendo razas:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  async obtenerPorId(id: string): Promise<RaceApi | undefined> {
    try {
      const raza = await RaceModel.findById(id).exec();
      if (!raza || raza.deletedAt) return undefined;
      return this.formatearRaza(raza);
    } catch (error) {
      console.error("Error obteniendo raza por id:", error);
      throw new Error("No se pudo obtener la raza");
    }
  }

  async crear(raza: CreateRace): Promise<RaceApi> {
    const nuevaRaza = new RaceModel({
      ...(raza.id ? { _id: raza.id } : {}),
      name: raza.name,
      description: raza.description ?? [],
      alignment: raza.alignment,
      img: raza.img,
      ability_bonuses: raza.ability_bonuses,
      age: raza.age,
      size: raza.size,
      size_range: raza.size_range,
      weight_range: raza.weight_range,
      speed: raza.speed,
      ruleset: raza.ruleset,
      traits: raza.traits,
      traits_data: raza.traits_data,
      languages: raza.languages,
      language_choices: raza.language_choices,
      parentId: raza.parentId || null,
      subraces_name: raza.subraces_name,
      proficiencies_choices: raza.proficiencies_choices,
      spell_choices: raza.spell_choices,
      spellcasting: raza.spellcasting || null,
      equipment: raza.equipment ?? [],
      creatureTypeId: raza.creatureTypeId || null,
      playable: raza.playable ?? true
    })

    await nuevaRaza.save()

    return this.formatearRaza(nuevaRaza)
  }

  async actualizar(raza: UpdateRace): Promise<RaceApi | undefined> {
    try {
      if (!raza.id) {
        throw new Error("No se proporciono el id de la raza");
      }

      const update = {
        name: raza.name,
        description: raza.description,
        alignment: raza.alignment,
        img: raza.img,
        ability_bonuses: raza.ability_bonuses,
        age: raza.age,
        size: raza.size,
        size_range: raza.size_range,
        weight_range: raza.weight_range,
        speed: raza.speed,
        ruleset: raza.ruleset,
        traits: raza.traits,
        traits_data: raza.traits_data,
        languages: raza.languages,
        language_choices: raza.language_choices,
        parentId: raza.parentId,
        subraces_name: raza.subraces_name,
        proficiencies_choices: raza.proficiencies_choices === null ? [] : raza.proficiencies_choices,
        spell_choices: raza.spell_choices === null ? [] : raza.spell_choices,
        spellcasting: raza.spellcasting,
        ...(raza.equipment !== undefined ? { equipment: raza.equipment === null ? [] : raza.equipment } : {}),
        ...(raza.creatureTypeId !== undefined ? { creatureTypeId: raza.creatureTypeId || null } : {}),
        ...(raza.playable !== undefined ? { playable: raza.playable } : {})
      }

      const razaActualizada = await RaceModel.findByIdAndUpdate(
        raza.id,
        update,
        { returnDocument: 'after' }
      ).exec();

      return razaActualizada ? this.formatearRaza(razaActualizada) : undefined
    } catch (error) {
      console.error("Error actualizando raza:", error);
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

  formatearRazas(razas: RaceMongo[], allowedRulesets?: string[], playable?: boolean): Promise<RaceApi[]> {
    return Promise.all(razas.map(raza => this.formatearRaza(raza, allowedRulesets, playable)));
  }

  async formatearRaza(raza: RaceMongo, allowedRulesets?: string[], playable?: boolean): Promise<RaceApi> {
    const dataLevel = raza?.levels?.find(level => level.level === 1)
    const ruleset = raza.ruleset;

    const [
      traits, ability_bonuses, ability_bonus_choices, skill_choices, languages, 
      proficiencies_choices, subraces, variants, spell_choices,
      speaksLanguages, formattedLanguageChoices, spellcasting, equipment, creatureType
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(raza?.traits ?? [], { ...dataLevel?.traits_data, ...raza.traits_data }),
      this.attributeService.formatAbilityBonuses(raza?.ability_bonuses ?? [], ruleset),
      this.attributeService.formatAbilityBonusChoices(raza?.ability_bonus_choices, ruleset),
      this.skillService.formatSkillChoices(raza.skill_choices),
      this.languageRepository.getLanguagesByIndex(raza?.languages?.understands ?? []),
      this.proficiencyRepository.formatProficiencyChoices(raza?.proficiencies_choices),
      this.formatearSubrazas(raza, { ...dataLevel?.traits_data, ...raza.traits_data }, allowedRulesets, playable),
      this.formatearVariantes(raza?.variants ?? [], ruleset),
      this.spellRepository.formatSpellChoices(raza?.spell_choices),
      this.languageRepository.getLanguagesByIndex(raza?.languages?.speaks ?? []),
      this.languageRepository.formatLanguageChoices(raza.language_choices, ruleset),
      this.formatRaceSpellcasting(raza),
      this.equipmentRepository.getCharacterEquipmentsByIds(raza.equipment ?? []),
      this.formatRaceCreatureType(raza)
    ])

    return {
      id: raza._id.toString(),
      name: raza.name,
      description: raza.description ?? [],
      alignment: raza.alignment,
      img: raza.img,
      ruleset: raza.ruleset,
      speed: typeof raza.speed === 'number' ? { walk: raza.speed } : (raza.speed ?? { walk: 30 }),
      size: raza.size,
      size_range: raza.size_range,
      weight_range: raza.weight_range,
      age: raza.age,
      ability_bonuses,
      ability_bonus_choices,
      skill_choices,
      traits,
      traits_data: { ...dataLevel?.traits_data, ...raza.traits_data },
      languages: {
        understands: languages,
        speaks: speaksLanguages,
        notes: raza?.languages?.notes ?? ""
      },
      language_choices: formattedLanguageChoices,
      proficiencies_choices,
      subraces,
      parentId: raza.parentId ? raza.parentId.toString() : null,
      variants,
      spell_choices,
      spellcasting: spellcasting ?? undefined,
      creatureType: creatureType ?? undefined,
      playable: raza.playable !== false,
      equipment: equipment ?? []
    };
  }

  async formatearSubrazas(
    raza: RaceMongo,
    traitsData?: TraitDataMongo,
    allowedRulesets?: string[],
    playable?: boolean
  ): Promise<SubracesApi | undefined> {
    const childQuery: {
      parentId: RaceMongo["_id"];
      deletedAt: null;
      ruleset?: { $in: string[] };
      playable?: false | { $ne: false };
    } = {
      parentId: raza._id,
      deletedAt: null,
      ...this.playableCondition(playable),
    };
    if (allowedRulesets) {
      childQuery.ruleset = { $in: allowedRulesets };
    }

    const childRaces = await RaceModel.find(childQuery);
    if (childRaces.length === 0) return undefined;

    const formateadas = await Promise.all(childRaces.map(child => this.formatearRaza(child, allowedRulesets, playable)));

    return {
      name: raza.subraces_name ?? 'Subrazas',
      list: ordenarPorNombre(formateadas)
    };
  }

  async formatearVariantes(variantes: VarianteMongo[], ruleset?: string): Promise<VarianteApi[]> {
    const formateadas = await Promise.all(variantes.map(variante => this.formatearVariante(variante, ruleset)))
    return ordenarPorNombre(formateadas);
  }

  async formatearVariante(variante: VarianteMongo, ruleset?: string): Promise<VarianteApi> {
    const [skill_choices, feats, ability_bonuses, ability_bonus_choices] = await Promise.all([
      ruleset ? this.skillService.formatSkillChoices(variante?.skill_choices) : Promise.resolve(undefined),
      this.featRepository.formatFeatChoices(variante.feats ?? variante.dotes, ruleset),
      ruleset ? this.attributeService.formatAbilityBonuses(variante?.ability_bonuses ?? [], ruleset) : Promise.resolve([]),
      ruleset ? this.attributeService.formatAbilityBonusChoices(variante?.ability_bonus_choices, ruleset) : Promise.resolve(undefined)
    ])

    return {
      name: variante.name,
      ability_bonuses,
      ability_bonus_choices,
      skill_choices,
      feats
    }
  }

  async dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined> {
    const raza = await RaceModel.findOne({ _id: idRaza as any, deletedAt: null });
    if (!raza) return undefined;

    const dataLevel = raza?.levels?.find(lev => lev.level === level);
    return dataLevel;
  }

  async getSpellcastingAttribute(raceId: string): Promise<AttributeApi | undefined> {
    const raza = await RaceModel.findOne({ _id: raceId as any, deletedAt: null })
      .select("_id spellcasting parentId ruleset")
      .lean<Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">>();

    if (!raza) return undefined;
    return this.formatRaceSpellcasting(raza);
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
      .lean<Array<Pick<RaceMongo, "_id" | "name" | "ruleset" | "creatureTypeId" | "parentId">>>();

    const refs: RaceRef[] = [];
    for (const race of races) {
      const creatureTypeId = await this.resolveInheritedCreatureTypeId(race);
      refs.push({
        id: race._id.toString(),
        name: race.name,
        ruleset: race.ruleset,
        creatureTypeId: creatureTypeId ?? null
      });
    }
    return refs;
  }

  async getRaceRefsBySystems(rulesets: string[]): Promise<RaceRef[]> {
    const uniqueRulesets = [...new Set(rulesets.filter(id => typeof id === "string" && id.length > 0))];
    if (!uniqueRulesets.length) return [];

    const races = await RaceModel.find({
      ruleset: { $in: uniqueRulesets },
      deletedAt: null
    })
      .select("_id name ruleset creatureTypeId parentId")
      .lean<Array<Pick<RaceMongo, "_id" | "name" | "ruleset" | "creatureTypeId" | "parentId">>>();

    const refs: RaceRef[] = [];
    for (const race of races) {
      const creatureTypeId = await this.resolveInheritedCreatureTypeId(race);
      refs.push({
        id: race._id.toString(),
        name: race.name,
        ruleset: race.ruleset,
        creatureTypeId: creatureTypeId ?? null
      });
    }
    return refs;
  }

  private async formatRaceSpellcasting(
    raza: Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">
  ): Promise<AttributeApi | undefined> {
    const source = await this.resolveInheritedSpellcastingSource(raza);
    if (!source) return undefined;
    return this.attributeService.formatSpellcastingAttribute(source.spellcasting, source.ruleset);
  }

  private async resolveInheritedSpellcastingSource(
    raza: Pick<RaceMongo, "_id" | "spellcasting" | "parentId" | "ruleset">,
    visited = new Set<string>()
  ): Promise<{ spellcasting: RaceMongo["spellcasting"]; ruleset: string } | undefined> {
    const id = raza._id?.toString();
    if (id) {
      if (visited.has(id)) return undefined;
      visited.add(id);
    }

    if (raza.spellcasting) {
      return { spellcasting: raza.spellcasting, ruleset: raza.ruleset };
    }

    if (!raza.parentId) return undefined;

    const parent = await RaceModel.findOne({ _id: raza.parentId as any, deletedAt: null })
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
    raza: Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">
  ): Promise<CreatureTypeApi | undefined> {
    const typeId = await this.resolveInheritedCreatureTypeId(raza);
    if (!typeId) return undefined;

    const creatureType = await this.creatureTypeRepository.getById(typeId);
    if (!creatureType || creatureType.deletedAt) return undefined;
    return creatureType;
  }

  private async resolveInheritedCreatureTypeId(
    raza: Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">,
    visited = new Set<string>()
  ): Promise<string | undefined> {
    const id = raza._id?.toString();
    if (id) {
      if (visited.has(id)) return undefined;
      visited.add(id);
    }

    if (raza.creatureTypeId) {
      return raza.creatureTypeId.toString();
    }

    if (!raza.parentId) return undefined;

    const parent = await RaceModel.findOne({ _id: raza.parentId as any, deletedAt: null })
      .select("_id creatureTypeId parentId")
      .lean<Pick<RaceMongo, "_id" | "creatureTypeId" | "parentId">>();

    if (!parent) return undefined;
    return this.resolveInheritedCreatureTypeId(parent, visited);
  }
}
