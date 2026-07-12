import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IRazaRepository from '../../../../domain/repositories/IRazaRepository';
import IAttributeRepository from '../../../../domain/repositories/IAttributeRepository';
import { CreateRace, RaceApi, RaceLevelMongo, RaceMongo, SubraceApi, SubraceMongo, SubracesApi, SubracesMongo, TypeApi, TypeMongo, VarianteApi, VarianteMongo } from '../../../../domain/types/razas.types';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { deepMerge, ordenarPorNombre } from '../../../../utils/formatters';
import RazaSchema from '../schemas/Raza';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import { TraitDataMongo } from '../../../../domain/types/traits.types';

import ISystemRepository from '../../../../domain/repositories/ISystemRepository';

export default class RazaRepository implements IRazaRepository {
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
      const razas = await RazaSchema.find()
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
      const razas = await RazaSchema.find({ ruleset: { $in: expandedRulesets } })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearRazas(razas);
    } catch (error) {
      console.error("Error obteniendo razas:", error);
      throw new Error("No se pudieron obtener los razas");
    }
  }

  async crear(raza: CreateRace): Promise<RaceApi> {
    const nuevaRaza = new RazaSchema({
      name: raza.name,
      description: raza.description ?? '',
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
      subraces: raza.subraces
    })

    nuevaRaza.save()

    return this.formatearRaza(nuevaRaza)
  }

  async actualizar(raza: CreateRace): Promise<RaceApi | undefined> {
    try {
      if (!raza.id) {
        throw new Error("No se proporciono el id de la raza");
      }

      const update = {
        name: raza.name,
        description: raza.description ?? '',
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
        subraces: raza.subraces
      }

      const razaActualizada = await RazaSchema.findByIdAndUpdate(
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

  formatearRazas(razas: RaceMongo[]): Promise<RaceApi[]> {
    return Promise.all(razas.map(raza => this.formatearRaza(raza)));
  }

  async formatearRaza(raza: RaceMongo): Promise<RaceApi> {
    const dataLevel = raza?.levels?.find(level => level.level === 1)
    const ruleset = raza.ruleset;

    const [traits, ability_bonuses, ability_bonus_choices, skill_choices, languages, proficiencies_choices, subraces, variants] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(raza?.traits ?? [], { ...dataLevel?.traits_data, ...raza.traits_data }),
      this.attributeRepository.formatAbilityBonuses(raza?.ability_bonuses ?? [], ruleset),
      this.attributeRepository.formatAbilityBonusChoices(raza?.ability_bonus_choices, ruleset),
      this.skillRepository.formatSkillChoices(raza.skill_choices),
      this.languageRepository.getLanguagesByIndex(raza?.languages?.understands ?? []),
      this.competenciaRepository.formatearOpcionesDeCompetencias(raza?.proficiencies_choices),
      this.formatearSubrazas(raza.subraces, { ...dataLevel?.traits_data, ...raza.traits_data }, ruleset),
      this.formatearVariantes(raza?.variants ?? [], ruleset)
    ])

    return {
      id: raza.index ?? raza?._id.toString(),
      name: raza.name,
      description: raza.description.length > 0 ? raza.description : [raza.desc],
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
      variants
    };
  }

  async formatearSubrazas(subrazas?: SubracesMongo, traitsData?: TraitDataMongo, ruleset?: string): Promise<SubracesApi | undefined> {
    if (!subrazas) return undefined;

    const formateadas = await Promise.all(subrazas?.list?.map(subraza => this.formatearSubraza(subraza, traitsData, ruleset)) ?? [])
    return {
      name: subrazas.name,
      list: ordenarPorNombre(formateadas)
    };
  }

  async formatearSubraza(subraza: SubraceMongo, traitsData?: TraitDataMongo, ruleset?: string): Promise<SubraceApi> {
    const [
      traits,
      understands,
      speaks,
      language_choices,
      spell_choices,
      ability_bonuses
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(subraza?.traits ?? [], deepMerge(subraza?.traits_data, traitsData)),
      this.languageRepository.getLanguagesByIndex(subraza?.languages?.understands ?? []),
      this.languageRepository.getLanguagesByIndex(subraza?.languages?.speaks ?? []),
      this.languageRepository.formatLanguageChoices(subraza.language_choices),
      this.conjuroRepository.formatearOpcionesDeConjuros(subraza?.spell_choices),
      ruleset ? this.attributeRepository.formatAbilityBonuses(subraza?.ability_bonuses ?? [], ruleset) : Promise.resolve([])
    ])

    return {
      index: subraza.index,
      name: subraza.name,
      img: subraza.img,
      description: subraza.description,
      ability_bonuses,
      traits,
      traits_data: subraza?.traits_data,
      languages: {
        speaks,
        understands,
        notes: subraza?.languages?.notes
      },
      language_choices,
      spell_choices,
      types: this.formatearTipos(subraza?.types ?? [])
    }
  }

  formatearTipos(tipos: TypeMongo[]): TypeApi[] {
    const formateadas = tipos.map(tipo => this.formatearTipo(tipo));
    return ordenarPorNombre(formateadas);
  }

  formatearTipo(tipo: TypeMongo): TypeApi {
    return {
      name: tipo.name,
      img: tipo.img,
      desc: tipo.desc,
    }
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
    const raza = await RazaSchema.findOne({ index: idRaza });
    if (!raza) return undefined;

    const dataLevel = raza?.levels?.find(lev => lev.level === level);
    return dataLevel;
  }
}


