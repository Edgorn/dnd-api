import { Types } from "mongoose";
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { ChoiceApi, ChoiceMongo } from "../../../../domain/types";
import { ChoiceSpell, SpellApi, SpellMongo, InputCreateSpell, InputUpdateSpell, SpellSchoolApi, SpellDamageApi } from "../../../../domain/types/spell.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import SpellSchema from "../schemas/Spell";
import { ConflictError, NotFoundError } from "../../../../domain/errors/AppError";

export default class SpellRepository implements ISpellRepository {
  constructor(
    private readonly systemRepository: ISystemRepository
  ) {}

  async create(data: InputCreateSpell): Promise<SpellApi> {
    try {
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
        duration: data.duration,
        damage: data.damage
      });

      await newSpell.save();
      await newSpell.populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type']);
      return this.formatSpell(newSpell);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A spell with name '${data.name}' already exists in system '${data.ruleset}'`);
      }
      throw error;
    }
  }

  async update(data: InputUpdateSpell): Promise<SpellApi> {
    try {
      const { id, ...updateFields } = data;

      const updatedSpell = await SpellSchema.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { returnDocument: 'after' }
      ).populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type']);

      if (!updatedSpell) {
        throw new NotFoundError(`No spell found with id: ${id}`);
      }

      return this.formatSpell(updatedSpell);
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new ConflictError(`A spell with name '${data.name}' already exists in system`);
      }
      throw error;
    }
  }

  async getBySystems(rulesets: string[]): Promise<SpellApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const spells = await SpellSchema.find({ ruleset: { $in: expandedRulesets }, deletedAt: null })
      .populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type'])
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });
    return this.formatSpells(spells);
  }

  async getById(id: string): Promise<SpellApi | null> {
    if (!Types.ObjectId.isValid(id)) {
      console.error(`[SpellRepository] Se ignoró la búsqueda de Conjuro por ID inválido (índice antiguo): ${id}`);
      return null;
    }
    const spell = await SpellSchema.findOne({ _id: id as any, deletedAt: null })
      .populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type'])
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

  async formatSpellChoices(choices: (ChoiceMongo | ChoiceSpell)[] | undefined): Promise<ChoiceApi<SpellApi>[] | undefined> {
    if (!choices) return undefined;
    return Promise.all(choices.map(choice => this.formatSpellChoice(choice)));
  }

  private async formatSpellChoice(choice: ChoiceMongo | ChoiceSpell | any): Promise<ChoiceApi<SpellApi>> {
    if (choice.options && Array.isArray(choice.options) && choice.options.length > 0) {
      const spells = await this.getSpellsByIndexes(choice.options);
      return {
        choose: choice.choose,
        options: spells,
        query_type: 'options'
      };
    }

    if (choice.filter) {
      const getFilterVal = (val: any) => val !== undefined ? (Array.isArray(val) ? val[0] : val) : undefined;
      const rawLevel = getFilterVal(choice.filter.level);
      const rawClass = getFilterVal(choice.filter.classes ?? choice.filter.class);

      const levelFilter = rawLevel !== undefined ? Number(rawLevel) : undefined;
      const classFilter = rawClass !== undefined ? String(rawClass) : undefined;
      const spells = await this.getSpellsByLevelAndClass(levelFilter!, [], classFilter);
      return {
        choose: choice.choose,
        options: spells,
        query_type: 'filter',
        query_filter: choice.filter
      };
    }

    if ('level' in choice || 'class' in choice) {
      const spells = await this.getSpellsByLevelAndClass(choice.level, [], choice.class);
      return {
        choose: choice.choose,
        options: spells,
        query_type: 'filter',
        query_filter: {
          level: choice.level,
          classes: choice.class
        }
      };
    }

    return {
      choose: choice.choose,
      options: []
    };
  }

  async getSpellsByIndexes(indexes: string[]): Promise<SpellApi[]> {
    if (!indexes.length) return [];

    const validMongoIds = indexes.filter(id => Types.ObjectId.isValid(id));
    const invalidIds = indexes.filter(id => !Types.ObjectId.isValid(id));

    if (invalidIds.length > 0) {
      console.error(`[SpellRepository] Conjuros ignorados por tener IDs inválidos (índices antiguos): ${invalidIds.join(', ')}`);
    }

    if (validMongoIds.length === 0) return [];

    const spells = await SpellSchema.find({ _id: { $in: validMongoIds as any }, deletedAt: null }).populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type']);
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
      .populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type'])
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
      .populate(['school', 'damage.base.type', 'damage.scaling.steps.components.type'])
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return this.formatSpells(spells);
  }

  // Legacy alias support for IConjuroRepository
  formatearOpcionesDeConjuros(opciones: (ChoiceMongo | ChoiceSpell)[] | undefined): Promise<ChoiceApi<SpellApi>[] | undefined> {
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

    const formatComponent = (c: any) => {
      const d = c.type;
      let typeObj: any = undefined;
      if (d && typeof d === 'object') {
        const damageId = d._id ? d._id.toString() : d.id;
        if (damageId) {
          typeObj = {
            id: damageId,
            name: d.name,
            description: d.description,
            color: d.color
          };
        }
      }
      return {
        diceCount: c.diceCount,
        diceType: c.diceType,
        type: typeObj
      };
    };

    let damageFormatted: SpellDamageApi | undefined = undefined;
    if (spell.damage) {
      const base = Array.isArray(spell.damage.base) ? spell.damage.base.map(formatComponent) : [];
      let scaling = undefined;
      if (spell.damage.scaling) {
        scaling = {
          mode: spell.damage.scaling.mode,
          steps: Array.isArray(spell.damage.scaling.steps)
            ? spell.damage.scaling.steps.map(step => ({
                level: step.level,
                type: step.type,
                components: Array.isArray(step.components) ? step.components.map(formatComponent) : []
              }))
            : []
        };
      }
      damageFormatted = {
        base,
        scaling
      };
    }

    return {
      id: spell._id ? spell._id.toString() : undefined,
      ruleset: spell.ruleset,
      name: spell.name,
      type: spell.type,
      level: spell.level,
      classes: Array.isArray(spell.classes) ? spell.classes.map((c: any) => typeof c === 'object' && c._id ? c._id.toString() : c.toString()) : [],
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
      damage: damageFormatted,
      description: spell.description || [],
      ritual: spell.ritual,
      deletedAt: spell.deletedAt
    };
  }
}
