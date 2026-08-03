import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { ChoiceApi } from "../../../../domain/types";
import { ChoiceSpell, SpellApi, SpellMongo, InputCreateSpell, InputUpdateSpell, SpellSchoolApi } from "../../../../domain/types/spell.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import SpellSchema from "../schemas/Spell";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";

export default class SpellRepository implements ISpellRepository {
  constructor(
    private readonly systemRepository: ISystemRepository
  ) {}

  async create(data: InputCreateSpell): Promise<SpellApi> {
    const newSpell = new SpellSchema({
      ruleset: data.ruleset,
      name: data.name,
      level: data.level,
      classes: data.classes,
      description: data.description,
      school: data.school,
      castingTime: data.castingTime,
      range: data.range,
      components: data.components,
      duration: data.duration
    });

    await newSpell.save();
    await newSpell.populate('school');
    return this.formatSpell(newSpell);
  }

  async update(data: InputUpdateSpell): Promise<SpellApi> {
    const { id, ...updateFields } = data;

    const updatedSpell = await SpellSchema.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    ).populate('school');

    if (!updatedSpell) {
      throw new NotFoundError(`No spell found with id: ${id}`);
    }

    return this.formatSpell(updatedSpell);
  }

  async getBySystems(rulesets: string[]): Promise<SpellApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const spells = await SpellSchema.find({ ruleset: { $in: expandedRulesets }, deletedAt: null })
      .populate('school')
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });
    return this.formatSpells(spells);
  }

  async getById(id: string): Promise<SpellApi | null> {
    const spell = await SpellSchema.findOne({ _id: id as any, deletedAt: null })
      .populate('school')
      .lean<SpellMongo>();
    if (!spell) return null;
    return this.formatSpell(spell);
  }

  async softDelete(id: string): Promise<void> {
    await SpellSchema.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    await SpellSchema.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async formatSpellChoices(choices: ChoiceSpell[] | undefined): Promise<ChoiceApi<SpellApi>[] | undefined> {
    if (!choices) return undefined;
    return Promise.all(choices.map(choice => this.formatSpellChoice(choice)));
  }

  private async formatSpellChoice(choice: ChoiceSpell): Promise<ChoiceApi<SpellApi>> {
    const spells = await this.getSpellsByLevelAndClass(choice.level, [], choice.class);
    return {
      choose: choice.choose,
      options: spells
    };
  }

  async getSpellsByIndexes(indexes: string[]): Promise<SpellApi[]> {
    if (!indexes.length) return [];
    const spells = await SpellSchema.find({ _id: { $in: indexes as any }, deletedAt: null }).populate('school');
    return ordenarPorNombre(this.formatSpells(spells));
  }

  async getSpellsByLevelAndClass(level: number, rulesets: string[] = [], className?: string): Promise<SpellApi[]> {
    const query: any = { deletedAt: null };

    if (rulesets && rulesets.length > 0) {
      const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
      query.ruleset = { $in: expandedRulesets };
    }

    if (level !== undefined) query.level = level;
    if (className !== undefined) query.classes = className;

    const spells = await SpellSchema.find(query)
      .populate('school')
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return this.formatSpells(spells);
  }

  async getRitualSpells(rulesets: string[] = []): Promise<SpellApi[]> {
    const query: any = { ritual: true, deletedAt: null };

    if (rulesets && rulesets.length > 0) {
      const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
      query.ruleset = { $in: expandedRulesets };
    }

    const spells = await SpellSchema.find(query)
      .populate('school')
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return this.formatSpells(spells);
  }

  // Legacy alias support for IConjuroRepository
  formatearOpcionesDeConjuros(opciones: ChoiceSpell[] | undefined): Promise<ChoiceApi<SpellApi>[] | undefined> {
    return this.formatSpellChoices(opciones);
  }

  obtenerConjurosPorIndices(indices: string[]): Promise<SpellApi[]> {
    return this.getSpellsByIndexes(indices);
  }

  obtenerConjurosPorNivelClase(nivel: number, clase?: string): Promise<SpellApi[]> {
    return this.getSpellsByLevelAndClass(nivel, [], clase);
  }

  obtenerConjurosRituales(): Promise<SpellApi[]> {
    return this.getRitualSpells([]);
  }

  private formatSpells(spells: SpellMongo[]): SpellApi[] {
    return spells.map(spell => this.formatSpell(spell));
  }

  private formatSpell(spell: SpellMongo): SpellApi {
    let schoolFormatted: SpellSchoolApi | undefined = undefined;
    if (spell.school && typeof spell.school === "object") {
      const s = spell.school;
      const schoolId = s._id ? s._id.toString() : s.id;
      if (schoolId) {
        schoolFormatted = {
          id: schoolId,
          name: s.name,
          description: s.description,
          color: s.color
        };
      }
    }

    return {
      id: spell._id ? spell._id.toString() : undefined,
      ruleset: spell.ruleset,
      name: spell.name,
      type: spell.type,
      level: spell.level,
      classes: spell.classes,
      typeName: spell.typeName,
      school: schoolFormatted,
      castingTime: spell.castingTime ? {
        value: spell.castingTime.value,
        unit: spell.castingTime.unit,
        condition: spell.castingTime.condition
      } : undefined,
      range: spell.range ? {
        type: spell.range.type,
        value: spell.range.value,
        unit: spell.range.unit,
        area: spell.range.area ? {
          shape: spell.range.area.shape,
          value: spell.range.area.value,
          unit: spell.range.area.unit
        } : undefined
      } : undefined,
      components: spell.components ? {
        verbal: spell.components.verbal,
        somatic: spell.components.somatic,
        material: spell.components.material,
        materialsDescription: spell.components.materialsDescription
      } : undefined,
      duration: spell.duration ? {
        type: spell.duration.type,
        value: spell.duration.value,
        unit: spell.duration.unit,
        concentration: spell.duration.concentration
      } : undefined,
      description: spell.description || [],
      ritual: spell.ritual,
      deletedAt: spell.deletedAt
    };
  }
}
