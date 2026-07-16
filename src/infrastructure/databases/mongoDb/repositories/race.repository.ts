import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IRaceRepository from '../../../../domain/repositories/IRaceRepository';
import IAttributeRepository from '../../../../domain/repositories/IAttributeRepository';
import { CreateRace, RaceApi, RaceLevelMongo, RaceMongo, SubracesApi, VarianteApi, VarianteMongo } from '../../../../domain/types/race.types';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { deepMerge, ordenarPorNombre } from '../../../../utils/formatters';
import RaceModel from '../schemas/Race';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import { TraitDataMongo } from '../../../../domain/types/traits.types';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';

export default class RaceRepository implements IRaceRepository {
  constructor(
    private readonly languageRepository: ILanguageRepository,
    private readonly conjuroRepository: IConjuroRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly competenciaRepository: ICompetenciaRepository,
    private readonly doteRepository: IDoteRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly attributeRepository: IAttributeRepository,
    private readonly systemRepository?: ISystemRepository
  ) { }

  async obtenerTodas(): Promise<RaceApi[]> {
    try {
      const razas = await RaceModel.find({ parentId: null, deletedAt: null })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      
      return this.formatearRazas(razas);
    } catch (error) {
      console.error("Error obteniendo razas:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  async obtenerPorSistema(ruleset: string): Promise<RaceApi[]> {
    try {
      const expandedRulesets = this.systemRepository
        ? await this.systemRepository.getSystemsAndAncestors([ruleset])
        : [ruleset];
      const razas = await RaceModel.find({ ruleset: { $in: expandedRulesets }, parentId: null, deletedAt: null })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      
      return this.formatearRazas(razas);
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
      parentId: raza.parentId || null,
      subraces_name: raza.subraces_name,
      spell_choices: raza.spell_choices
    })

    await nuevaRaza.save()

    return this.formatearRaza(nuevaRaza)
  }

  async actualizar(raza: CreateRace): Promise<RaceApi | undefined> {
    try {
      if (!raza.id) {
        throw new Error("No se proporciono el id de la raza");
      }

      const update = {
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
        parentId: raza.parentId || null,
        subraces_name: raza.subraces_name,
        spell_choices: raza.spell_choices
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

  formatearRazas(razas: RaceMongo[]): Promise<RaceApi[]> {
    return Promise.all(razas.map(raza => this.formatearRaza(raza)));
  }

  async formatearRaza(raza: RaceMongo): Promise<RaceApi> {
    const dataLevel = raza?.levels?.find(level => level.level === 1)
    const ruleset = raza.ruleset;

    const [traits, ability_bonuses, ability_bonus_choices, skill_choices, languages, proficiencies_choices, subraces, variants, spell_choices] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(raza?.traits ?? [], { ...dataLevel?.traits_data, ...raza.traits_data }),
      this.attributeRepository.formatAbilityBonuses(raza?.ability_bonuses ?? [], ruleset),
      this.attributeRepository.formatAbilityBonusChoices(raza?.ability_bonus_choices, ruleset),
      this.skillRepository.formatSkillChoices(raza.skill_choices),
      this.languageRepository.getLanguagesByIndex(raza?.languages?.understands ?? []),
      this.competenciaRepository.formatearOpcionesDeCompetencias(raza?.proficiencies_choices),
      this.formatearSubrazas(raza, { ...dataLevel?.traits_data, ...raza.traits_data }, ruleset),
      this.formatearVariantes(raza?.variants ?? [], ruleset),
      this.conjuroRepository.formatearOpcionesDeConjuros(raza?.spell_choices)
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
        speaks: await this.languageRepository.getLanguagesByIndex(raza?.languages?.speaks ?? []),
        notes: raza?.languages?.notes  ?? ""
      },
      language_choices: await this.languageRepository.formatLanguageChoices(raza.language_choices),
      proficiencies_choices,
      subraces,
      variants,
      spell_choices
    };
  }

  async formatearSubrazas(raza: RaceMongo, traitsData?: TraitDataMongo, ruleset?: string): Promise<SubracesApi | undefined> {
    const childRaces = await RaceModel.find({ parentId: raza._id, deletedAt: null });
    if (childRaces.length === 0) return undefined;

    const formateadas = await Promise.all(childRaces.map(child => this.formatearRaza(child)));

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
    const [skill_choices, dotes, ability_bonuses, ability_bonus_choices] = await Promise.all([
      ruleset ? this.skillRepository.formatSkillChoices(variante?.skill_choices) : Promise.resolve(undefined),
      this.doteRepository.formatearOpcionesDeDote(variante.dotes),
      ruleset ? this.attributeRepository.formatAbilityBonuses(variante?.ability_bonuses ?? [], ruleset) : Promise.resolve([]),
      ruleset ? this.attributeRepository.formatAbilityBonusChoices(variante?.ability_bonus_choices, ruleset) : Promise.resolve(undefined)
    ])

    return {
      name: variante.name,
      ability_bonuses,
      ability_bonus_choices,
      skill_choices,
      dotes
    }
  }

  async dataLevelUp(idRaza: string, level: number): Promise<RaceLevelMongo | undefined> {
    const raza = await RaceModel.findOne({ _id: idRaza as any, deletedAt: null });
    if (!raza) return undefined;

    const dataLevel = raza?.levels?.find(lev => lev.level === level);
    return dataLevel;
  }
}
