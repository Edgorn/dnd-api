import mongoose from 'mongoose';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import SistemasModel from '../schemas/System';
import { System, SystemRulesConfig, TypeCrearSystem, TypeModificarSystem } from '../../../../domain/types/system.types';
import { ValidationError } from '../../../../domain/errors/AppError';
import { mergeRulesFromAncestry } from '../../../../utils/systemRulesMerge';

export default class SystemRepository implements ISystemRepository {
  constructor() {}

  private async getAncestry(systemId: string): Promise<System[]> {
    const ancestry: System[] = [];
    let currentId = systemId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const sys = await this.getById(currentId);
      if (!sys) break;
      ancestry.push(sys);
      currentId = sys.parentId ? sys.parentId.toString() : '';
    }
    return ancestry;
  }

  private async findSystemsDocs(systems: string[]) {
    if (!systems || systems.length === 0) return [];

    const validIds = systems.filter(s => mongoose.Types.ObjectId.isValid(s));
    return SistemasModel.find({
      $or: [
        { _id: { $in: validIds as any[] } },
        { name: { $in: systems } }
      ],
      deletedAt: null
    });
  }

  async getMergedRulesConfig(systemIds: string[]): Promise<SystemRulesConfig> {
    const systemsDocs = await this.findSystemsDocs(systemIds);
    if (systemsDocs.length === 0) return {};

    for (const sys of systemsDocs) {
      const ancestry = await this.getAncestry(sys._id.toString());
      const config = mergeRulesFromAncestry(ancestry);
      if (Object.keys(config).length > 0) {
        return config;
      }
    }

    return {};
  }

  async getGlobalModifierFormula(systems: string[]): Promise<string | undefined> {
    const config = await this.getMergedRulesConfig(systems);
    return config.globalModifierFormula;
  }

  async getInitiativeBonusFormula(systems: string[]): Promise<string | undefined> {
    const config = await this.getMergedRulesConfig(systems);
    return config.initiativeBonusFormula;
  }

  async getByUserId(userId: string, accessibleSystemIds: string[]): Promise<System[]> {
    const query: Record<string, unknown> = {
      $or: [
        { publisher: userId, deletedAt: null },
        { isOpen: true, deletedAt: null }
      ]
    };

    if (accessibleSystemIds.length > 0) {
      const validIds = accessibleSystemIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        (query.$or as Record<string, unknown>[]).push({ _id: { $in: validIds }, deletedAt: null });
      }
    }

    return SistemasModel.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 })
      .lean();
  }

  async create(data: TypeCrearSystem): Promise<System | null> {
    const parentIdObj = data.parentId && mongoose.Types.ObjectId.isValid(data.parentId)
      ? new mongoose.Types.ObjectId(data.parentId)
      : undefined;

    const nuevoSistema = new SistemasModel({
      name: data.name,
      description: data.description,
      publisher: data.publisher,
      isOpen: data.isOpen,
      isBase: data.isBase,
      parentId: parentIdObj,
      globalModifierFormula: data.globalModifierFormula,
      initiativeBonusFormula: data.initiativeBonusFormula,
      defaultMinAttributeValue: data.defaultMinAttributeValue,
      defaultMaxAttributeValue: data.defaultMaxAttributeValue,
      creationMinAttributeValue: data.creationMinAttributeValue,
      creationMaxAttributeValue: data.creationMaxAttributeValue,
      maxLevel: data.maxLevel,
      maxSpellLevel: data.maxSpellLevel,
      xpProgression: data.xpProgression,
      proficiencyProgression: data.proficiencyProgression,
      hpInitialFormula: data.hpInitialFormula,
      hpLevelUpFormula: data.hpLevelUpFormula,
      baseAcFormula: data.baseAcFormula,
      passiveSkillFormula: data.passiveSkillFormula,
      carryingCapacityFormula: data.carryingCapacityFormula,
    });

    const resultado = await nuevoSistema.save();
    return resultado ? resultado.toObject() : null;
  }

  async update(data: TypeModificarSystem): Promise<System | null> {
    const {
      id,
      name,
      description,
      isOpen,
      isBase,
      parentId,
      globalModifierFormula,
      initiativeBonusFormula,
      maxAttributeValue,
      defaultMinAttributeValue,
      defaultMaxAttributeValue,
      creationMinAttributeValue,
      creationMaxAttributeValue,
      maxLevel,
      maxSpellLevel,
      xpProgression,
      proficiencyProgression,
      hpInitialFormula,
      hpLevelUpFormula,
      baseAcFormula,
      passiveSkillFormula,
      carryingCapacityFormula,
    } = data;

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (isOpen !== undefined) updateFields.isOpen = isOpen;
    if (isBase !== undefined) updateFields.isBase = isBase;
    if (parentId !== undefined) {
      updateFields.parentId = parentId && mongoose.Types.ObjectId.isValid(parentId)
        ? new mongoose.Types.ObjectId(parentId)
        : null;
    }
    if (globalModifierFormula !== undefined) updateFields.globalModifierFormula = globalModifierFormula;
    if (initiativeBonusFormula !== undefined) updateFields.initiativeBonusFormula = initiativeBonusFormula;
    if (maxAttributeValue !== undefined) updateFields.maxAttributeValue = maxAttributeValue;
    if (defaultMinAttributeValue !== undefined) updateFields.defaultMinAttributeValue = defaultMinAttributeValue;
    if (defaultMaxAttributeValue !== undefined) updateFields.defaultMaxAttributeValue = defaultMaxAttributeValue;
    if (creationMinAttributeValue !== undefined) updateFields.creationMinAttributeValue = creationMinAttributeValue;
    if (creationMaxAttributeValue !== undefined) updateFields.creationMaxAttributeValue = creationMaxAttributeValue;
    if (maxLevel !== undefined) updateFields.maxLevel = maxLevel;
    if (maxSpellLevel !== undefined) updateFields.maxSpellLevel = maxSpellLevel;
    if (xpProgression !== undefined) updateFields.xpProgression = xpProgression;
    if (proficiencyProgression !== undefined) updateFields.proficiencyProgression = proficiencyProgression;
    if (hpInitialFormula !== undefined) updateFields.hpInitialFormula = hpInitialFormula;
    if (hpLevelUpFormula !== undefined) updateFields.hpLevelUpFormula = hpLevelUpFormula;
    if (baseAcFormula !== undefined) updateFields.baseAcFormula = baseAcFormula;
    if (passiveSkillFormula !== undefined) updateFields.passiveSkillFormula = passiveSkillFormula;
    if (carryingCapacityFormula !== undefined) updateFields.carryingCapacityFormula = carryingCapacityFormula;

    const resultado = await SistemasModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { returnDocument: 'after' }
    );

    return resultado ? resultado.toObject() : null;
  }

  async getById(id: string): Promise<System | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return SistemasModel.findOne({ _id: id, deletedAt: null } as any).lean();
  }

  async getByIdWithDeleted(id: string): Promise<System | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return SistemasModel.findOne({ _id: id } as any).lean();
  }

  async verifySystemsNotBase(systems: string[]): Promise<void> {
    if (!systems || systems.length === 0) return;
    const validIds = systems.filter(s => mongoose.Types.ObjectId.isValid(s));
    const systemsDocs = await SistemasModel.find({
      $or: [
        { _id: { $in: validIds as any[] } },
        { name: { $in: systems } }
      ]
    });
    for (const sys of systemsDocs) {
      if (sys.isBase) {
        throw new ValidationError(`No se pueden crear elementos para el sistema base '${sys.name}'`);
      }
    }
  }

  async getSystemsAndAncestors(systems: string[]): Promise<string[]> {
    if (!systems || systems.length === 0) return [];

    const validIds = systems.filter(s => mongoose.Types.ObjectId.isValid(s));
    const systemsDocs = await SistemasModel.find({
      $or: [
        { _id: { $in: validIds as any[] } },
        { name: { $in: systems } }
      ]
    });

    const resultSet = new Set<string>(systems);

    for (const sys of systemsDocs) {
      const ancestry = await this.getAncestry(sys._id.toString());
      for (const ancestor of ancestry) {
        if (ancestor._id) resultSet.add(ancestor._id.toString());
        if (ancestor.name) resultSet.add(ancestor.name);
      }
    }

    return Array.from(resultSet);
  }

  async softDelete(id: string, deletedAt: Date): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await SistemasModel.findByIdAndUpdate(id, { $set: { deletedAt } });
  }

  async restore(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) return;
    await SistemasModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }
}
