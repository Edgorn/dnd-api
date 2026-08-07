import ICharacterClassRepository from '../../../../domain/repositories/ICharacterClassRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import SkillService from '../../../../domain/services/skill.service';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import { ChoiceApi } from '../../../../domain/types';
import {
  CharacterClassApi,
  CharacterClassLevelMongo,
  CharacterClassMongo,
  ClaseLevelUp,
  InputCreateCharacterClass,
  InputUpdateCharacterClass,
  SpellcastingLevel,
  SubclassApi,
  SubclassMongo,
  SubclassOptionApi,
  SubclassesMongo,
  SubclassesOptionsMongo,
  SubclassesOptionsMongoOption
} from '../../../../domain/types/characterClass.types';
import { DoteApi } from '../../../../domain/types/dotes.types';
import { formatearSalvacion } from '../../../../utils/formatters';
import mongoose from 'mongoose';
import CharacterClassModel from '../schemas/CharacterClass';
import { NotFoundError } from '../../../../domain/errors/AppError';

export default class CharacterClassRepository implements ICharacterClassRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly skillService?: SkillService,
    private readonly proficiencyRepository?: IProficiencyRepository,
    private readonly equipamientoRepository?: IEquipamientoRepository,
    private readonly traitRepository?: ITraitRepository,
    private readonly conjuroRepository?: IConjuroRepository,
    private readonly doteRepository?: IDoteRepository,
    private readonly invocacionRepository?: IInvocacionRepository,
    private readonly languageRepository?: ILanguageRepository
  ) { }

  async getBySystems(rulesets: string[], includeDeleted: boolean = false): Promise<CharacterClassApi[]> {
    try {
      const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
      const query: any = { ruleset: { $in: expandedRulesets } };
      if (!includeDeleted) {
        query.deletedAt = null;
      }
      const classes = await CharacterClassModel.find(query)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 })
        .lean<CharacterClassMongo[]>();

      return this.formatearClases(classes);
    } catch (error) {
      console.error("Error obteniendo clases:", error);
      throw new Error("No se pudieron obtener las clases");
    }
  }

  async getById(id: string): Promise<CharacterClassApi | null> {
    const doc = await CharacterClassModel.findById(id).lean<CharacterClassMongo>();
    if (!doc) return null;
    return this.formatearClase(doc);
  }

  async create(data: InputCreateCharacterClass): Promise<CharacterClassApi> {
    const newClass = new CharacterClassModel({
      ruleset: data.ruleset,
      name: data.name,
      description: data.description || [],
      img: data.img || ""
    });

    await newClass.save();
    return this.formatearClase(newClass);
  }

  async update(data: InputUpdateCharacterClass): Promise<CharacterClassApi> {
    const { id, ...updateFields } = data;
    const updatedClass = await CharacterClassModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    if (!updatedClass) {
      throw new NotFoundError(`No se encontró la clase con id: ${id}`);
    }

    return this.formatearClase(updatedClass);
  }

  async softDelete(id: string): Promise<void> {
    await CharacterClassModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await CharacterClassModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async dataLevelUp(idClase: string, level: number, subclasses: string[]): Promise<ClaseLevelUp | null> {
    if (!mongoose.Types.ObjectId.isValid(idClase)) {
      return null;
    }
    const clase = await CharacterClassModel.findById(idClase);

    if (!clase) {
      return null;
    }

    const dataLevel = clase.levels?.find(data => data.level === level);
    const dataLevelOld = clase.levels?.find(data => data.level === level - 1);

    if (!dataLevel) {
      return null;
    }

    const traitsId: string[] = [];

    Object.keys(dataLevel?.traits_data ?? {})?.forEach(t => {
      const data = dataLevel.traits_data[t];
      const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null;

      if (this.valoresNumericosDistintos(data, dataOld)) {
        traitsId.push(t);
      }
    });

    traitsId.push(...(dataLevel?.traits ?? []));

    const traitsSinRepetidos = [...new Set(traitsId)];
    const traits = this.traitRepository
      ? await this.traitRepository.getTraitsByIndexes(traitsSinRepetidos, dataLevel?.traits_data)
      : [];

    const subclasesData = await this.formatearSubclaseType(dataLevel.subclasses_options, dataLevel.subclasses);

    const subclaseData = await Promise.all(
      subclasses.map(subclase => {
        if (dataLevel?.subclasses && dataLevel?.subclasses[subclase]) {
          return this.formatearSubclase(dataLevel.subclasses[subclase]);
        } else {
          return null;
        }
      })
    );

    let dotes: ChoiceApi<DoteApi> | undefined = undefined;

    if (dataLevel.ability_score && this.doteRepository) {
      dotes = await this.doteRepository.formatearOpcionesDeDote(1);
    }

    const spell_choices = this.conjuroRepository ? await this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.spell_choices) : undefined;
    const mixed_spell = this.conjuroRepository ? await this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.mixed_spell_choices?.options) : undefined;
    const spell_changes_aux = this.conjuroRepository ? await this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.spell_changes?.options) : undefined;

    const mixed_spell_choices = Array.from({ length: dataLevel?.mixed_spell_choices?.number ?? 0 }, () => mixed_spell?.map(opt => ({ ...opt })) ?? []);
    const spell_changes = Array.from({ length: dataLevel?.spell_changes?.number ?? 0 }, () => spell_changes_aux?.map(opt => ({ ...opt })) ?? []);

    const skill_choices = this.skillService ? await this.skillService.formatSkillChoices(dataLevel.skill_choices) : undefined;
    const invocations_choices = this.invocacionRepository ? await this.invocacionRepository.obtenerOpciones(dataLevel.invocations ?? 0) : undefined;
    const invocations_change = this.invocacionRepository ? await this.invocacionRepository.obtenerOpciones(dataLevel.invocations_change ?? 0) : undefined;

    const spells = this.conjuroRepository ? await this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spell_group?.level ?? 0, dataLevel?.spell_group?.class ?? '') : [];

    let traits_options = undefined;

    if (dataLevel?.traits_options && this.traitRepository) {
      const traitsAux = await this.traitRepository.getTraitsByIndexes(dataLevel?.traits_options?.options ?? []);
      traits_options = {
        ...dataLevel.traits_options,
        options: traitsAux
      };
    }

    const validSubclaseSpells = subclaseData
      .filter((item): item is SubclassApi => !!item?.spells)
      .flatMap(item => item.spells ?? []);

    const uniqueSpells = [
      ...new Map(
        [
          ...spells,
          ...validSubclaseSpells
        ].map(spell => [spell.id ?? spell.name, spell])
      ).values()
    ].sort((a, b) => a.name.localeCompare(b.name));

    return {
      hit_die: clase.hit_die || 8,
      traits: [
        ...traits ?? [],
        ...subclaseData.filter((item): item is SubclassApi => item !== null && item !== undefined).flatMap(item => item.traits) ?? []
      ],
      traits_data: dataLevel.traits_data,
      traits_options:
        traits_options
        ?? subclaseData.find(item => item !== null && item !== undefined)?.traits_options
        ?? undefined,
      subclasesData,
      ability_score: dataLevel.ability_score,
      dotes,
      double_skills: dataLevel.double_skills,
      spell_choices,
      mixed_spell_choices: [
        ...mixed_spell_choices ?? [],
        ...subclaseData
          .filter((item): item is SubclassApi => !!item?.mixed_spell_choices)
          .map(item => item.mixed_spell_choices ?? [])
          .flat() ?? []
      ],
      spells: [...uniqueSpells ?? []],
      spell_changes,
      skill_choices,
      invocations_choices,
      invocations_change
    };
  }

  async spellcastingClases(clases: { id: string, level: number }[]): Promise<(SpellcastingLevel | null)[]> {
    const validObjectIds = clases
      .map(clase => clase.id)
      .filter(id => mongoose.Types.ObjectId.isValid(id));

    if (validObjectIds.length === 0) return [];

    const clasesData = await CharacterClassModel.find({ _id: { $in: validObjectIds } }).lean<CharacterClassMongo[]>();

    return Promise.all(clasesData.map(clase => this.spellcastingClase(clase, clases)));
  }

  private async spellcastingClase(clase: CharacterClassMongo, clasesLevel: { id: string, level: number }[]): Promise<SpellcastingLevel | null> {
    const level = clasesLevel.find(clas => clas.id === clase._id?.toString())?.level;

    if (!level) return null;

    const spellcasting = clase.levels?.find(lev => lev.level === level)?.spellcasting;

    if (!spellcasting) return null;

    return {
      class: clase._id?.toString() || '',
      ability: clase.spellcasting || '',
      spellcasting
    };
  }

  private formatearClases(clases: CharacterClassMongo[]): Promise<CharacterClassApi[]> {
    return Promise.all(
      clases.map(clase => this.formatearClase(clase))
    );
  }

  private async formatearClase(clase: CharacterClassMongo): Promise<CharacterClassApi> {
    const dataLevel = clase?.levels?.find(level => level.level === 1);

    const [
      traits,
      proficiencies,
      proficiencies_choices,
      skill_choices,
      spells,
      spell_choices,
      equipment,
      equipment_choices
    ] = await Promise.all([
      this.traitRepository ? this.traitRepository.getTraitsByIndexes(dataLevel?.traits ?? [], dataLevel?.traits_data) : [],
      this.proficiencyRepository ? this.proficiencyRepository.getProficienciesByIndices([...clase.proficiencies ?? [], ...dataLevel?.proficiencies ?? []]) : [],
      this.proficiencyRepository ? this.proficiencyRepository.formatProficiencyChoices(clase?.proficiencies_choices ?? []) : [],
      this.skillService ? this.skillService.formatSkillChoices(clase.skill_choices) : undefined,
      this.conjuroRepository ? this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spell_group?.level ?? 0, dataLevel?.spell_group?.class ?? '') : [],
      this.conjuroRepository ? this.conjuroRepository.formatearOpcionesDeConjuros(dataLevel?.spell_choices) : undefined,
      this.equipamientoRepository ? this.equipamientoRepository.obtenerEquipamientosPersonajePorIndices(clase?.equipment) : [],
      this.equipamientoRepository ? this.equipamientoRepository.formatearOpcionesDeEquipamientos(clase?.equipment_choices) : []
    ]);

    const subclasesData = await this.formatearSubclaseType(dataLevel?.subclasses_options, dataLevel?.subclasses);

    return {
      id: clase._id ? clase._id.toString() : "",
      ruleset: clase.ruleset || "",
      name: clase.name,
      description: clase?.description ?? [],
      hit_die: clase.hit_die ?? 8,
      img: clase.img || "",
      prof_bonus: 2,
      spellcasting: clase.spellcasting,
      proficiencies,
      proficiencies_choices,
      saving_throws: formatearSalvacion(clase?.saving_throws ?? []),
      skill_choices,
      spells,
      spell_choices,
      equipment,
      equipment_choices,
      traits,
      traits_data: dataLevel?.traits_data ?? {},
      subclasesData: subclasesData ?? undefined,
      deletedAt: clase.deletedAt
    };
  }

  private valoresNumericosDistintos(obj1: { [key: string]: string }, obj2: { [key: string]: string } | null): boolean {
    for (const key in obj1) {
      if (!obj2) {
        return true;
      } else if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }

  private async formatearSubclaseType(subclase_type: SubclassesOptionsMongo | undefined, subclases: SubclassesMongo | undefined) {
    if (subclase_type && subclases) {
      const options = await this.formatearSubclases(subclase_type?.options, subclases);

      return {
        name: subclase_type.name,
        desc: subclase_type.desc,
        options: options.filter(option => option.id !== "fanatic")
      };
    } else {
      return null;
    }
  }

  private async formatearSubclases(subclases_options: SubclassesOptionsMongoOption[], subclases: SubclassesMongo) {
    const formateadas = await Promise.all(subclases_options.map(subclase_option => this.formatearSubclaseOption(subclase_option, subclases)));

    formateadas.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }

  private async formatearSubclaseOption(subclase_option: SubclassesOptionsMongoOption, subclases: SubclassesMongo): Promise<SubclassOptionApi> {
    const subclaseData = subclases[subclase_option?.id];
    const subclase = await this.formatearSubclase(subclaseData);

    return {
      id: subclase_option?.id,
      name: subclase_option?.name,
      img: subclase_option?.img,
      traits: subclase.traits,
      traits_options: subclase?.traits_options,
      skill_choices: subclase?.skill_choices,
      double_skill_choices: subclase?.double_skill_choices,
      proficiencies: subclase?.proficiencies,
      spells: subclase?.spells,
      spell_choices: subclase?.spell_choices,
      language_choices: subclase?.language_choices
    };
  }

  private async formatearSubclase(subclase: SubclassMongo): Promise<SubclassApi> {
    const traitsId = subclase?.traits ?? [];

    Object.keys(subclase?.traits_data ?? {})?.forEach(t => {
      traitsId.push(t);
    });

    const traits = this.traitRepository ? await this.traitRepository.getTraitsByIndexes(traitsId, subclase?.traits_data ?? {}) : [];

    let traits_options = undefined;

    if (subclase?.traits_options && this.traitRepository) {
      const traitsAux = await this.traitRepository.getTraitsByIndexes(subclase?.traits_options?.options ?? []);
      traits_options = {
        ...subclase.traits_options,
        options: traitsAux
      };
    }

    const mixed_spell = this.conjuroRepository ? await this.conjuroRepository.formatearOpcionesDeConjuros(subclase?.mixed_spell_choices?.options) : undefined;
    const mixed_spell_choices = Array.from({ length: subclase?.mixed_spell_choices?.number ?? 0 }, () => mixed_spell?.map(opt => ({ ...opt })) ?? []);

    const skill_choices = this.skillService ? await this.skillService.formatSkillChoices(subclase.skill_choices) : undefined;
    const proficiencies = this.proficiencyRepository ? await this.proficiencyRepository.getProficienciesByIndices(subclase?.proficiencies ?? []) : [];
    const spells = this.conjuroRepository ? await this.conjuroRepository.obtenerConjurosPorIndices(subclase?.spells ?? []) : [];
    const languagesOptions = this.languageRepository ? await this.languageRepository.formatLanguageChoices(subclase?.language_choices) : undefined;
    const double_skill_choices = this.skillService ? await this.skillService.formatSkillChoices(subclase?.double_skill_choices) : undefined;
    const spell_choices = this.conjuroRepository ? await this.conjuroRepository.formatearOpcionesDeConjuros(subclase?.spell_choices) : undefined;

    return {
      traits,
      traits_options: traits_options,
      mixed_spell_choices,
      skill_choices,
      double_skill_choices,
      proficiencies,
      spells,
      spell_choices,
      language_choices: languagesOptions
    };
  }
}
