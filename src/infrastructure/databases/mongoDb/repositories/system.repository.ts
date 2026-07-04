import mongoose from 'mongoose';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import SistemasModel from '../schemas/System';
import { System, SystemApi, TypeCrearSystem, TypeModificarSystem } from '../../../../domain/types/system.types';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import RaceModel from '../schemas/Raza';
import IdiomaModel from '../schemas/Idioma';
import RasgoModel from '../schemas/Rasgo';
import AttributeModel from '../schemas/Attribute';
import { AttributeApi } from '../../../../domain/types/attribute.types';
import { SkillApi } from '../../../../domain/types/skill.types';
import { ValidationError } from '../../../../domain/errors/AppError';

export default class SystemRepository implements ISystemRepository {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly skillRepository: ISkillRepository
  ) {}

  private async getSystemAncestry(systemId: string): Promise<System[]> {
    const ancestry: System[] = [];
    let currentId = systemId;
    const visited = new Set<string>();

    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const sys = await this.obtenerPorId(currentId);
      if (!sys) break;
      ancestry.push(sys);
      currentId = sys.parentId ? sys.parentId.toString() : '';
    }
    return ancestry;
  }

  private async getDirectSystemAttributes(sysId: string, sysName: string): Promise<AttributeApi[]> {
    const rulesetQuery = {
      $or: [
        { ruleset: sysId },
        { ruleset: sysName }
      ]
    };

    const docs = await AttributeModel.find(rulesetQuery);
    return docs.map(doc => ({
      id: doc._id.toString(),
      ruleset: doc.ruleset || [],
      name: doc.name || '',
      description: doc.description || '',
      key: doc.key || '',
      abbreviation: doc.abbreviation || '',
      icon: doc.icon
    }));
  }

  private async obtenerEstadisticasSistemaMulti(rulesets: string[]) {
    const rulesetQuery = {
      ruleset: { $in: rulesets }
    };

    const [racesCount, languagesCount, traitsCount] = await Promise.all([
      RaceModel.countDocuments(rulesetQuery),
      IdiomaModel.countDocuments(rulesetQuery),
      RasgoModel.countDocuments(rulesetQuery)
    ]);

    return { racesCount, languagesCount, traitsCount };
  }

  private async buildSystemApi(sys: any, userId?: string): Promise<SystemApi> {
    const ancestry = await this.getSystemAncestry(sys._id.toString());

    let publisherName = sys.publisher;
    if (mongoose.Types.ObjectId.isValid(sys.publisher)) {
      const user = await this.userRepository.getUserById(sys.publisher);
      if (user) {
        publisherName = user.name;
      }
    }

    const isPublisher = userId ? sys.publisher === userId : false;

    const ancestryRulesets: string[] = [];
    for (const ancestor of ancestry) {
      ancestryRulesets.push(ancestor._id.toString());
      if (ancestor.name) {
        ancestryRulesets.push(ancestor.name);
      }
    }

    const { racesCount, languagesCount, traitsCount } = await this.obtenerEstadisticasSistemaMulti(ancestryRulesets);

    const attributesMap = new Map<string, AttributeApi>();
    for (let i = ancestry.length - 1; i >= 0; i--) {
      const ancestor = ancestry[i];
      const sysAttrs = await this.getDirectSystemAttributes(ancestor._id.toString(), ancestor.name);
      for (const attr of sysAttrs) {
        attributesMap.set(attr.key, attr);
      }
    }
    const attributes = Array.from(attributesMap.values());

    const skillsMap = new Map<string, SkillApi>();
    for (let i = ancestry.length - 1; i >= 0; i--) {
      const ancestor = ancestry[i];
      const sysSkills = await this.skillRepository.getBySystems([ancestor._id.toString(), ancestor.name]);
      for (const skill of sysSkills) {
        skillsMap.set(skill.key, skill);
      }
    }
    const skills = Array.from(skillsMap.values());

    const getMergedScalar = <T>(key: keyof System, defaultValue?: T): T | undefined => {
      for (const ancestor of ancestry) {
        const val = ancestor[key];
        if (val !== undefined && val !== null && val !== '') {
          return val as unknown as T;
        }
      }
      return defaultValue;
    };

    return {
      id: sys._id.toString(),
      name: sys.name || '',
      description: sys.description || '',
      publisher: publisherName,
      isOpen: !!sys.isOpen,
      isBase: !!sys.isBase,
      parentId: sys.parentId ? sys.parentId.toString() : undefined,
      canEdit: isPublisher,
      racesCount,
      languagesCount,
      traitsCount,
      globalModifierFormula: getMergedScalar<string>('globalModifierFormula'),
      initiativeBonusFormula: getMergedScalar<string>('initiativeBonusFormula'),
      defaultMinAttributeValue: getMergedScalar<number>('defaultMinAttributeValue'),
      defaultMaxAttributeValue: getMergedScalar<number>('defaultMaxAttributeValue'),
      creationMinAttributeValue: getMergedScalar<number>('creationMinAttributeValue'),
      creationMaxAttributeValue: getMergedScalar<number>('creationMaxAttributeValue'),
      attributes,
      skills
    };
  }

  async obtenerFormulaModificadorGlobal(systems: string[]): Promise<string | undefined> {
    if (!systems || systems.length === 0) return undefined;

    const validIds = systems.filter(s => mongoose.Types.ObjectId.isValid(s));
    const systemsDocs = await SistemasModel.find({
      $or: [
        { _id: { $in: validIds as any[] } },
        { name: { $in: systems } }
      ]
    });

    for (const sys of systemsDocs) {
      const ancestry = await this.getSystemAncestry(sys._id.toString());
      for (const ancestor of ancestry) {
        if (ancestor.globalModifierFormula) {
          return ancestor.globalModifierFormula;
        }
      }
    }
    return undefined;
  }

  async obtenerFormulaBonoIniciativa(systems: string[]): Promise<string | undefined> {
    if (!systems || systems.length === 0) return undefined;

    const validIds = systems.filter(s => mongoose.Types.ObjectId.isValid(s));
    const systemsDocs = await SistemasModel.find({
      $or: [
        { _id: { $in: validIds as any[] } },
        { name: { $in: systems } }
      ]
    });

    for (const sys of systemsDocs) {
      const ancestry = await this.getSystemAncestry(sys._id.toString());
      for (const ancestor of ancestry) {
        if (ancestor.initiativeBonusFormula) {
          return ancestor.initiativeBonusFormula;
        }
      }
    }
    return undefined;
  }

  async consultarSistemasPorUsuario(userId: string): Promise<SystemApi[] | any> {
    const usuario = await this.userRepository.getUserById(userId);
    const accessibleSystemIds = usuario?.accessibleSystems || [];

    const query: any = {
      $or: [
        { publisher: userId },
        { isOpen: true }
      ]
    };

    if (accessibleSystemIds.length > 0) {
      const validIds = accessibleSystemIds.filter(id => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        query.$or.push({ _id: { $in: validIds } });
      }
    }

    const sistemas = await SistemasModel.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return Promise.all(sistemas.map(async (sys) => {
      return this.buildSystemApi(sys, userId);
    }));
  }

  async crear(data: TypeCrearSystem): Promise<SystemApi | null> {
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
      creationMaxAttributeValue: data.creationMaxAttributeValue
    });

    const resultado = await nuevoSistema.save();
    return this.buildSystemApi(resultado, data.publisher);
  }

  async modificar(data: TypeModificarSystem): Promise<SystemApi | null> {
    const { id, name, description, isOpen, isBase, parentId, globalModifierFormula, initiativeBonusFormula, defaultMinAttributeValue, defaultMaxAttributeValue, creationMinAttributeValue, creationMaxAttributeValue } = data;

    const updateFields: any = {};
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
    if (defaultMinAttributeValue !== undefined) updateFields.defaultMinAttributeValue = defaultMinAttributeValue;
    if (defaultMaxAttributeValue !== undefined) updateFields.defaultMaxAttributeValue = defaultMaxAttributeValue;
    if (creationMinAttributeValue !== undefined) updateFields.creationMinAttributeValue = creationMinAttributeValue;
    if (creationMaxAttributeValue !== undefined) updateFields.creationMaxAttributeValue = creationMaxAttributeValue;

    const resultado = await SistemasModel.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    );

    if (!resultado) return null;
    return this.buildSystemApi(resultado, data.userId);
  }

  async obtenerPorId(id: string): Promise<System | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    return SistemasModel.findById(id).lean();
  }

  async verificarSistemasNoBase(systems: string[]): Promise<void> {
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
      const ancestry = await this.getSystemAncestry(sys._id.toString());
      for (const ancestor of ancestry) {
        if (ancestor._id) resultSet.add(ancestor._id.toString());
        if (ancestor.name) resultSet.add(ancestor.name);
      }
    }

    return Array.from(resultSet);
  }
}
