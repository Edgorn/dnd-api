import { Types } from 'mongoose';
import ILanguageRepository from '../../../../domain/repositories/ILanguageRepository';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { InputCreateLanguage, InputUpdateLanguage, LanguageApi, LanguageMongo } from '../../../../domain/types/language.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import LanguageSchema from '../schemas/Language';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import { ConflictError, NotFoundError } from '../../../../domain/errors/AppError';

export default class LanguageRepository implements ILanguageRepository {
  constructor(private readonly systemRepository?: ISystemRepository) { }

  async getBySystems(rulesets: string[], userId?: string): Promise<LanguageApi[]> {
    const expandedRulesets = this.systemRepository
      ? await this.systemRepository.getSystemsAndAncestors(rulesets)
      : rulesets;

    const rulesetQuery: any = { ruleset: { $in: expandedRulesets } };

    // Si tenemos userId, verificamos si es publisher de AL MENOS UNO de los sistemas (para simplificar, mostramos borrados si es publisher)
    let includeDeleted = false;
    if (userId && this.systemRepository) {
      for (const ruleset of expandedRulesets) {
        const sys = await this.systemRepository.obtenerPorId(ruleset);
        if (sys && sys.publisher === userId) {
          includeDeleted = true;
          break;
        }
      }
    }

    if (!includeDeleted) {
      rulesetQuery.deletedAt = null;
    }
    const languages = await LanguageSchema.find(rulesetQuery);
    return this.formatLanguages(languages);
  }

  async create(data: InputCreateLanguage): Promise<LanguageApi> {
    try {
      const newLanguage = new LanguageSchema({
        name: data.name,
        description: data.description,
        type: data.type,
        script: data.script,
        ruleset: data.ruleset
      });

      await newLanguage.save();
      return this.formatLanguage(newLanguage);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A language with this name already exists`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateLanguage): Promise<LanguageApi> {
    const { id, ...updateFields } = data;
    const updatedLanguage = await LanguageSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!updatedLanguage) {
      throw new NotFoundError(`No language found with id: ${id}`);
    }

    return this.formatLanguage(updatedLanguage);
  }

  async getLanguagesByIndex(indexes: string[]): Promise<LanguageApi[]> {
    if (!indexes.length) return [];

    const validMongoIds = indexes.filter(item => Types.ObjectId.isValid(item));
    const stringIndexes = indexes.filter(item => !Types.ObjectId.isValid(item));

    const languages = await LanguageSchema.find({
      $or: [
        { _id: { $in: validMongoIds } as any },
        { index: { $in: stringIndexes } }
      ],
      deletedAt: null
    });

    return ordenarPorNombre(this.formatLanguages(languages));
  }

  async formatLanguageChoices(choices: ChoiceMongo | undefined): Promise<ChoiceApi<LanguageApi> | undefined> {
    if (!choices) return undefined;

    if (Array.isArray(choices.options)) {
      const languages = await this.getLanguagesByIndex(choices.options);

      return {
        choose: choices.choose,
        options: languages
      };
    }

    if (choices.options === 'all') {
      const languages = await this.getAll();

      return {
        choose: choices.choose,
        options: languages
      };
    }

    console.warn("Unrecognized language choices:", choices.options);
    return undefined;
  }

  async getAll(): Promise<LanguageApi[]> {
    const languages = await LanguageSchema.find({ deletedAt: null })
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return ordenarPorNombre(this.formatLanguages(languages));
  }

  private formatLanguages(languages: LanguageMongo[]): LanguageApi[] {
    return languages.map(language => this.formatLanguage(language));
  }

  private formatLanguage(language: LanguageMongo): LanguageApi {
    return {
      id: language.index ?? language._id.toString(),
      name: language.name,
      type: language.type,
      description: language.description,
      script: language.script,
      ruleset: language.ruleset || '',
      deletedAt: language.deletedAt
    }
  }

  async getById(id: string): Promise<LanguageApi | null> {
    let language;
    if (Types.ObjectId.isValid(id)) {
      language = await LanguageSchema.findById(id);
    } else {
      language = await LanguageSchema.findOne({ index: id });
    }
    if (!language) return null;
    return this.formatLanguage(language);
  }

  async softDelete(id: string): Promise<void> {
    if (Types.ObjectId.isValid(id)) {
      await LanguageSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
    } else {
      await LanguageSchema.findOneAndUpdate({ index: id }, { $set: { deletedAt: new Date() } });
    }
  }

  async restore(id: string): Promise<void> {
    if (Types.ObjectId.isValid(id)) {
      await LanguageSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
    } else {
      await LanguageSchema.findOneAndUpdate({ index: id }, { $set: { deletedAt: null } });
    }
  }
}
