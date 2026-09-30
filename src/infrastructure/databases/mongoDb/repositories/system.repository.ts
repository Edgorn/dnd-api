import mongoose from "mongoose";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import SistemasModel from "../schemas/System";
import { System, SystemKind, SystemRulesConfig, TypeCrearSystem, TypeModificarSystem } from "../../../../domain/types/system.types";
import { mergeRulesFromAncestry } from "../../../../utils/systemRulesMerge";
import { linearize, parentIdStrings, parentsOfFromSystems } from "../../../../domain/services/systemHierarchy";

type SystemDocument = System & { parentId?: { toString(): string } | null };

export default class SystemRepository implements ISystemRepository {
  constructor() {}

  private toSystem(doc: SystemDocument | null | undefined): System | null {
    if (!doc) return null;
    const parentIds = this.readParentIds(doc);
    return { ...doc, parentIds };
  }

  private readParentIds(doc: SystemDocument): NonNullable<System["parentIds"]> {
    if (Array.isArray(doc.parentIds) && doc.parentIds.length > 0) {
      return doc.parentIds;
    }
    if (doc.parentId) {
      return [doc.parentId] as NonNullable<System["parentIds"]>;
    }
    return [];
  }

  private toParentsOf(graph: Map<string, System>) {
    return parentsOfFromSystems(
      [...graph.values()].map((system) => ({
        id: system._id.toString(),
        parentIds: parentIdStrings(system.parentIds),
      }))
    );
  }

  private async loadAncestorGraph(starts: System[]): Promise<Map<string, System>> {
    const graph = new Map<string, System>();
    let frontier: System[] = [];

    for (const start of starts) {
      const normalized = this.toSystem(start as SystemDocument);
      if (!normalized) continue;
      const id = normalized._id.toString();
      if (!graph.has(id)) {
        graph.set(id, normalized);
        frontier.push(normalized);
      }
    }

    while (frontier.length > 0) {
      const missing = new Set<string>();
      for (const system of frontier) {
        for (const parentId of parentIdStrings(system.parentIds)) {
          if (!graph.has(parentId) && mongoose.Types.ObjectId.isValid(parentId)) {
            missing.add(parentId);
          }
        }
      }

      if (missing.size === 0) break;

      const docs = await SistemasModel.find({
        _id: { $in: [...missing] },
        deletedAt: null,
      } as Record<string, unknown>).lean<SystemDocument[]>();

      frontier = [];
      for (const doc of docs) {
        const normalized = this.toSystem(doc);
        if (!normalized) continue;
        const id = normalized._id.toString();
        if (graph.has(id)) continue;
        graph.set(id, normalized);
        frontier.push(normalized);
      }
    }

    return graph;
  }

  private async resolveSystem(systemId: string): Promise<System | null> {
    if (mongoose.Types.ObjectId.isValid(systemId)) {
      const byId = await this.getById(systemId);
      if (byId) return byId;
    }

    const byName = await SistemasModel.findOne({ name: systemId, deletedAt: null }).lean<SystemDocument>();
    return this.toSystem(byName);
  }

  async getAncestry(systemId: string): Promise<System[]> {
    const start = await this.resolveSystem(systemId);
    if (!start) return [];

    const graph = await this.loadAncestorGraph([start]);
    const order = linearize([start._id.toString()], this.toParentsOf(graph));
    return order
      .map((id) => graph.get(id))
      .filter((system): system is System => Boolean(system));
  }

  private hydrate(doc: unknown): SystemDocument {
    if (
      doc
      && typeof doc === "object"
      && "toObject" in doc
      && typeof (doc as { toObject: unknown }).toObject === "function"
    ) {
      return (doc as { toObject: () => SystemDocument }).toObject();
    }
    return doc as SystemDocument;
  }

  private async findSystemsDocs(systems: string[]): Promise<SystemDocument[]> {
    if (!systems || systems.length === 0) return [];

    const validIds = systems.filter((s) => mongoose.Types.ObjectId.isValid(s));
    const docs = await SistemasModel.find({
      $or: [
        { _id: { $in: validIds } },
        { name: { $in: systems } },
      ],
      deletedAt: null,
    } as Record<string, unknown>);
    return docs.map((doc) => this.hydrate(doc));
  }

  async getMergedRulesConfig(systemIds: string[]): Promise<SystemRulesConfig> {
    const systemsDocs = await this.findSystemsDocs(systemIds);
    const starts = systemsDocs
      .map((doc) => this.toSystem(doc))
      .filter((system): system is System => Boolean(system));
    if (starts.length === 0) return {};

    const graph = await this.loadAncestorGraph(starts);
    const linearized = linearize(
      starts.map((system) => system._id.toString()),
      this.toParentsOf(graph)
    );
    const ancestry = linearized
      .map((id) => graph.get(id))
      .filter((system): system is System => Boolean(system));
    return mergeRulesFromAncestry(ancestry);
  }

  async getGlobalModifierFormula(systems: string[]): Promise<string | undefined> {
    const config = await this.getMergedRulesConfig(systems);
    return config.globalModifierFormula;
  }

  async getInitiativeBonusFormula(systems: string[]): Promise<string | undefined> {
    const config = await this.getMergedRulesConfig(systems);
    return config.initiativeBonusFormula;
  }

  async getByUserId(userId: string, accessibleSystemIds: string[], kind?: SystemKind): Promise<System[]> {
    const access: Record<string, unknown>[] = [
      { publisher: userId, deletedAt: null },
      { isOpen: true, deletedAt: null },
    ];

    if (accessibleSystemIds.length > 0) {
      const validIds = accessibleSystemIds.filter((id) => mongoose.Types.ObjectId.isValid(id));
      if (validIds.length > 0) {
        access.push({ _id: { $in: validIds }, deletedAt: null });
      }
    }

    const filter: Record<string, unknown> = kind
      ? { $and: [{ $or: access }, kindClause(kind)] }
      : { $or: access };

    const docs = await SistemasModel.find(filter)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<SystemDocument[]>();

    return docs
      .map((doc) => this.toSystem(doc))
      .filter((system): system is System => Boolean(system));
  }

  private childFilter(id: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
    const objectId = new mongoose.Types.ObjectId(id);
    return {
      $or: [{ parentIds: objectId }, { parentId: objectId }],
      ...extra,
    };
  }

  async hasChildren(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const count = await SistemasModel.countDocuments(this.childFilter(id, { deletedAt: null }));
    return count > 0;
  }

  async getChildren(id: string): Promise<System[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) return [];
    const docs = await SistemasModel.find(this.childFilter(id, { deletedAt: null })).lean<SystemDocument[]>();
    return docs
      .map((doc) => this.toSystem(doc))
      .filter((system): system is System => Boolean(system));
  }

  async getChildrenDeletedAt(id: string, deletedAt: Date): Promise<System[]> {
    if (!mongoose.Types.ObjectId.isValid(id)) return [];
    const docs = await SistemasModel.find(this.childFilter(id, { deletedAt })).lean<SystemDocument[]>();
    return docs
      .map((doc) => this.toSystem(doc))
      .filter((system): system is System => Boolean(system));
  }

  private toObjectIds(parentIds: string[] | undefined): mongoose.Types.ObjectId[] {
    if (!parentIds) return [];
    return parentIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }

  async create(data: TypeCrearSystem): Promise<System | null> {
    const nuevoSistema = new SistemasModel({
      name: data.name,
      description: data.description,
      publisher: data.publisher,
      isOpen: data.isOpen,
      isBase: data.isBase,
      kind: data.kind ?? "ruleset",
      parentIds: this.toObjectIds(data.parentIds),
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
      abilityScoreProgression: data.abilityScoreProgression,
      hpInitialFormula: data.hpInitialFormula,
      hpLevelUpFormula: data.hpLevelUpFormula,
      baseAcFormula: data.baseAcFormula,
      passiveSkillFormula: data.passiveSkillFormula,
      carryingCapacityFormula: data.carryingCapacityFormula,
      attackBonusFormula: data.attackBonusFormula,
      damageBonusFormula: data.damageBonusFormula,
      meleeAttackAttributes: data.meleeAttackAttributes,
      rangedAttackAttributes: data.rangedAttackAttributes,
    });

    const resultado = await nuevoSistema.save();
    return resultado ? this.toSystem(resultado.toObject()) : null;
  }

  async update(data: TypeModificarSystem): Promise<System | null> {
    const {
      id,
      name,
      description,
      isOpen,
      isBase,
      kind,
      parentIds,
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
      abilityScoreProgression,
      hpInitialFormula,
      hpLevelUpFormula,
      baseAcFormula,
      passiveSkillFormula,
      carryingCapacityFormula,
      attackBonusFormula,
      damageBonusFormula,
      meleeAttackAttributes,
      rangedAttackAttributes,
    } = data;

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (isOpen !== undefined) updateFields.isOpen = isOpen;
    if (isBase !== undefined) updateFields.isBase = isBase;
    if (kind !== undefined) updateFields.kind = kind;
    if (parentIds !== undefined) updateFields.parentIds = this.toObjectIds(parentIds);
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
    if (abilityScoreProgression !== undefined) updateFields.abilityScoreProgression = abilityScoreProgression;
    if (hpInitialFormula !== undefined) updateFields.hpInitialFormula = hpInitialFormula;
    if (hpLevelUpFormula !== undefined) updateFields.hpLevelUpFormula = hpLevelUpFormula;
    if (baseAcFormula !== undefined) updateFields.baseAcFormula = baseAcFormula;
    if (passiveSkillFormula !== undefined) updateFields.passiveSkillFormula = passiveSkillFormula;
    if (carryingCapacityFormula !== undefined) updateFields.carryingCapacityFormula = carryingCapacityFormula;
    if (attackBonusFormula !== undefined) updateFields.attackBonusFormula = attackBonusFormula;
    if (damageBonusFormula !== undefined) updateFields.damageBonusFormula = damageBonusFormula;
    if (meleeAttackAttributes !== undefined) updateFields.meleeAttackAttributes = meleeAttackAttributes;
    if (rangedAttackAttributes !== undefined) updateFields.rangedAttackAttributes = rangedAttackAttributes;

    const resultado = await SistemasModel.findByIdAndUpdate(
      id,
      parentIds !== undefined
        ? { $set: updateFields, $unset: { parentId: 1 } }
        : { $set: updateFields },
      { returnDocument: "after" }
    );

    return resultado ? this.toSystem(resultado.toObject()) : null;
  }

  async getById(id: string): Promise<System | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await SistemasModel.findOne({ _id: id, deletedAt: null } as Record<string, unknown>).lean<SystemDocument>();
    return this.toSystem(doc);
  }

  async getByIds(ids: string[]): Promise<System[]> {
    const systemsDocs = await this.findSystemsDocs(ids);
    return systemsDocs
      .map((doc) => this.toSystem(doc))
      .filter((system): system is System => Boolean(system));
  }

  async getByIdWithDeleted(id: string): Promise<System | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }
    const doc = await SistemasModel.findOne({ _id: id } as Record<string, unknown>).lean<SystemDocument>();
    return this.toSystem(doc);
  }

  async getSystemsAndAncestors(systems: string[]): Promise<string[]> {
    if (!systems || systems.length === 0) return [];

    const systemsDocs = await this.findSystemsDocs(systems);
    const starts = systemsDocs
      .map((doc) => this.toSystem(doc))
      .filter((system): system is System => Boolean(system));

    const resultSet = new Set<string>(systems);
    if (starts.length === 0) return Array.from(resultSet);

    const graph = await this.loadAncestorGraph(starts);
    for (const ancestor of graph.values()) {
      if (ancestor._id) resultSet.add(ancestor._id.toString());
      if (ancestor.name) resultSet.add(ancestor.name);
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

function kindClause(kind: SystemKind): Record<string, unknown> {
  if (kind === "ruleset") {
    return {
      $or: [
        { kind: "ruleset" },
        { kind: { $exists: false } },
        { kind: null },
      ],
    };
  }

  return { kind };
}
