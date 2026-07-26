import { Types } from 'mongoose';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { ProficiencyApi, ProficiencyMongo } from '../../../../domain/types/proficiencies.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import ProficiencySchema from '../schemas/Proficiency';
import SystemRepository from './system.repository';

export default class ProficiencyRepository implements IProficiencyRepository {
  constructor(private readonly systemRepository: SystemRepository) {}

  async getProficienciesByIndices(indices: string[]): Promise<ProficiencyApi[]> {
    if (!indices.length) return [];
    
    // Filter to ensure only valid MongoDB ObjectIds are passed to _id query
    const validMongoIds = indices.filter(item => Types.ObjectId.isValid(item));
    if (!validMongoIds.length) return [];

    const proficiencies = await ProficiencySchema.find({ _id: { $in: validMongoIds } as any, deletedAt: null });
    
    return ordenarPorNombre(this.formatProficiencies(proficiencies));
  }

  async formatProficiencyChoices(opciones: ChoiceMongo[] | undefined): Promise<ChoiceApi<ProficiencyApi>[]> {
    if (!opciones) return [];

    const opcionesDeCompetencias = await Promise.all(
      opciones.map(opc => this.formatProficiencyChoice(opc))
    );

    return opcionesDeCompetencias.filter((item): item is ChoiceApi<ProficiencyApi> => item !== undefined);
  }

  async getProficiencyById(id: string): Promise<ProficiencyApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const proficiency = await ProficiencySchema.findOne({ _id: id as any, deletedAt: null });
    return proficiency ? this.formatProficiency(proficiency) : null;
  }

  async getProficienciesBySystems(systems: string[]): Promise<ProficiencyApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(systems);
    
    const proficiencies = await ProficiencySchema.find({
      ruleset: { $in: expandedRulesets },
      deletedAt: null
    }).collation({ locale: 'es', strength: 1 }).sort({ name: 1 });

    return this.formatProficiencies(proficiencies);
  }

  async createProficiency(proficiency: Omit<ProficiencyApi, "id" | "deletedAt">): Promise<ProficiencyApi> {
    const newProficiency = new ProficiencySchema(proficiency);
    await newProficiency.save();
    return this.formatProficiency(newProficiency);
  }

  async updateProficiency(id: string, proficiency: Partial<Omit<ProficiencyApi, "id" | "deletedAt">>): Promise<ProficiencyApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const updated = await ProficiencySchema.findOneAndUpdate(
      { _id: id as any, deletedAt: null },
      { $set: proficiency },
      { returnDocument: 'after' }
    );
    return updated ? this.formatProficiency(updated as any) : null;
  }

  async softDeleteProficiency(id: string): Promise<ProficiencyApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const deleted = await ProficiencySchema.findOneAndUpdate(
      { _id: id as any, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { returnDocument: 'after' }
    );
    return deleted ? this.formatProficiency(deleted as any) : null;
  }

  async restoreProficiency(id: string): Promise<ProficiencyApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const restored = await ProficiencySchema.findOneAndUpdate(
      { _id: id as any, deletedAt: { $ne: null } },
      { $set: { deletedAt: null } },
      { returnDocument: 'after' }
    );
    return restored ? this.formatProficiency(restored as any) : null;
  }

  private async formatProficiencyChoice(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<ProficiencyApi> | undefined> {
    if (!opciones) return undefined;

    // Legacy data handling where options was a string (type)
    if (typeof opciones.options === 'string') {
      const proficiencies = await this.getProficienciesByType(opciones.options as unknown as string);
      return {
        choose: opciones.choose,
        options: proficiencies
      };
    }

    if (opciones.options && opciones.options.length > 0) {
      const proficiencies = await this.getProficienciesByIndices(opciones.options);
      return {
        choose: opciones.choose,
        options: proficiencies
      };
    }

    if (opciones.filter) {
      const query: any = { deletedAt: null };
      
      for (const [key, value] of Object.entries(opciones.filter)) {
        if (Array.isArray(value)) {
          query[key] = { $in: value };
        } else {
          query[key] = value;
        }
      }

      const proficiencies = await ProficiencySchema.find(query)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      return {
        choose: opciones.choose,
        options: this.formatProficiencies(proficiencies)
      };
    }

    return undefined;
  }

  private async getProficienciesByType(type: string): Promise<ProficiencyApi[]> {
    const proficiencies = await ProficiencySchema.find({ type, deletedAt: null })
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });
    return this.formatProficiencies(proficiencies);
  }
  
  private formatProficiencies(proficiencies: ProficiencyMongo[]): ProficiencyApi[] {
    return proficiencies.map(p => this.formatProficiency(p));
  }
  
  private formatProficiency(proficiency: ProficiencyMongo): ProficiencyApi {
    return {
      id: proficiency._id!.toString(),
      name: proficiency.name,
      type: proficiency.type,
      parentProficiencyId: proficiency.parentProficiencyId ? (proficiency.parentProficiencyId as any).toString() : null,
      ruleset: proficiency.ruleset,
      deletedAt: proficiency.deletedAt
    }
  }
}
