import ISystemRepository from "../repositories/ISystemRepository";
import IRaceRepository from "../repositories/IRaceRepository";
import ICharacterClassRepository from "../repositories/ICharacterClassRepository";
import OptionGroupService from "./optionGroup.service";
import {
  System,
  SystemKind,
  SystemRulesConfig,
  SYSTEM_RULE_FIELD_KEYS,
  TypeCrearSystem,
  TypeModificarSystem,
  resolveSystemKind,
} from "../types/system.types";
import { AppError } from "../errors/AppError";
import {
  linearize,
  mostSpecificBases,
  parentIdStrings,
  parentsOfFromSystems,
} from "./systemHierarchy";
import { isRaceExcluded, mergeCatalogExclusions } from "../../utils/catalogExclusions";

const PENDING_SYSTEM_ID = "__pending__";

type HierarchyInput = {
  kind: SystemKind;
  isBase: boolean;
  parentIds: string[];
  publisher: string;
  id?: string;
  rulesSource: Record<string, unknown>;
  storedRulesSource?: Record<string, unknown>;
};

export default class SystemService {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly optionGroupService?: OptionGroupService,
    private readonly raceRepository?: IRaceRepository,
    private readonly characterClassRepository?: ICharacterClassRepository
  ) {}

  getByUserId(userId: string, accessibleSystemIds: string[], kind?: SystemKind): Promise<System[]> {
    return this.systemRepository.getByUserId(userId, accessibleSystemIds, kind);
  }

  async create(data: TypeCrearSystem): Promise<System | null> {
    const kind = resolveSystemKind(data.kind);
    const parentIds = data.parentIds ?? [];
    const isBase = this.resolveIsBase(data.isBase, parentIds);

    const normalized: TypeCrearSystem = {
      ...data,
      kind,
      parentIds,
      isBase,
    };

    await this.assertHierarchy({
      kind,
      isBase,
      parentIds,
      publisher: normalized.publisher,
      rulesSource: normalized as unknown as Record<string, unknown>,
    });
    await this.assertAbilityScoreAlternativeGroup(normalized.abilityScoreAlternativeGroupId, parentIds);
    await this.assertCatalogExclusions({
      excludedRaceIds: normalized.excludedRaceIds,
      excludedClassIds: normalized.excludedClassIds,
      parentIds,
    });

    return this.systemRepository.create(normalized);
  }

  async update(data: TypeModificarSystem): Promise<System | null> {
    const system = await this.systemRepository.getById(data.id);
    if (!system) {
      throw new AppError("Sistema no encontrado", 404);
    }

    if (system.publisher !== data.userId) {
      throw new AppError("No tienes permisos de edición para este sistema", 403);
    }

    const kind = data.kind !== undefined ? resolveSystemKind(data.kind) : resolveSystemKind(system.kind);
    const parentIds = data.parentIds !== undefined ? data.parentIds : parentIdStrings(system.parentIds);
    const isBase = this.resolveIsBase(
      data.isBase !== undefined ? data.isBase : system.isBase,
      parentIds
    );

    const hierarchyChanged =
      data.isBase !== undefined || data.parentIds !== undefined;

    await this.assertHierarchy({
      kind,
      isBase,
      parentIds,
      publisher: data.userId,
      id: data.id,
      rulesSource: data as unknown as Record<string, unknown>,
      storedRulesSource: system as unknown as Record<string, unknown>,
    });

    if (hierarchyChanged) {
      await this.revalidateDescendants(data.id, { parentIds, isBase });
    }

    await this.assertAbilityScoreAlternativeGroup(data.abilityScoreAlternativeGroupId, [data.id]);
    await this.assertCatalogExclusions({
      excludedRaceIds: data.excludedRaceIds,
      excludedClassIds: data.excludedClassIds,
      parentIds,
      systemId: data.id,
    });

    return this.systemRepository.update({ ...data, kind, isBase, parentIds });
  }

  getById(id: string): Promise<System | null> {
    return this.systemRepository.getById(id);
  }

  getByIds(ids: string[]): Promise<System[]> {
    return this.systemRepository.getByIds(ids);
  }

  getByIdWithDeleted(id: string): Promise<System | null> {
    return this.systemRepository.getByIdWithDeleted(id);
  }

  getAncestry(systemId: string): Promise<System[]> {
    return this.systemRepository.getAncestry(systemId);
  }

  getAncestorGraph(starts: System[]): Promise<Map<string, System>> {
    return this.systemRepository.getAncestorGraph(starts);
  }

  getChildren(id: string): Promise<System[]> {
    return this.systemRepository.getChildren(id);
  }

  getChildrenDeletedAt(id: string, deletedAt: Date): Promise<System[]> {
    return this.systemRepository.getChildrenDeletedAt(id, deletedAt);
  }

  getSystemsAndAncestors(systems: string[]): Promise<string[]> {
    return this.systemRepository.getSystemsAndAncestors(systems);
  }

  getMergedRulesConfig(systemIds: string[]): Promise<SystemRulesConfig> {
    return this.systemRepository.getMergedRulesConfig(systemIds);
  }

  softDelete(id: string, deletedAt: Date): Promise<void> {
    return this.systemRepository.softDelete(id, deletedAt);
  }

  restore(id: string): Promise<void> {
    return this.systemRepository.restore(id);
  }

  async getResolvedCatalogExclusions(rulesets: string[]): Promise<{ raceIds: Set<string>; classIds: Set<string> }> {
    if (!rulesets.length) {
      return { raceIds: new Set(), classIds: new Set() };
    }

    const graph = await this.collectAncestryGraph(rulesets);
    return mergeCatalogExclusions([...graph.values()]);
  }

  async assertRaceAllowed(raceId: string, rulesets: string[]): Promise<void> {
    if (!raceId || !rulesets.length) return;
    const { raceIds } = await this.getResolvedCatalogExclusions(rulesets);
    if (raceIds.size === 0) return;

    const ancestorChain = await this.raceAncestorIds(raceId);
    if (isRaceExcluded(raceId, ancestorChain, raceIds)) {
      throw new AppError("La raza no está disponible en este sistema", 400);
    }
  }

  async assertClassAllowed(classId: string, rulesets: string[]): Promise<void> {
    if (!classId || !rulesets.length) return;
    const { classIds } = await this.getResolvedCatalogExclusions(rulesets);
    if (classIds.has(classId)) {
      throw new AppError("La clase no está disponible en este sistema", 400);
    }
  }

  async assertSingleBase(systemIds: string[]): Promise<void> {
    if (!systemIds || systemIds.length === 0) return;

    const unique = [...new Set(systemIds)];
    const found = await this.systemRepository.getByIds(unique);
    if (found.length === 0) {
      throw new AppError("Ninguno de los sistemas indicados existe", 400);
    }

    const graph = await this.collectAncestryGraph(found.map((system) => system._id.toString()));
    const parentsOf = parentsOfFromSystems(
      [...graph.values()].map((system) => ({
        id: system._id.toString(),
        parentIds: parentIdStrings(system.parentIds),
      }))
    );
    const linearized = linearize(
      found.map((system) => system._id.toString()),
      parentsOf
    );
    const bases = mostSpecificBases(linearized, parentsOf, baseIdSet(graph));
    if (bases.length !== 1) {
      throw new AppError("Los sistemas deben resolver a una única base más específica", 400);
    }
  }

  private resolveIsBase(isBase: boolean | undefined, parentIds: string[]): boolean {
    if (parentIds.length === 0) {
      if (isBase === false) {
        throw new AppError("Un sistema raíz debe ser base (motor de juego)", 400);
      }
      return true;
    }
    return isBase ?? false;
  }

  private async assertHierarchy(input: HierarchyInput): Promise<void> {
    this.assertContentLayerHasNoRules(input.kind, input.rulesSource, input.storedRulesSource);
    this.assertBaseFlag(input.kind, input.isBase);

    if ((input.kind === "setting" || input.kind === "campaign") && input.parentIds.length === 0) {
      throw new AppError("Los sistemas de tipo setting y campaign requieren al menos un sistema padre", 400);
    }

    if (input.id && input.parentIds.includes(input.id)) {
      throw new AppError("La jerarquía de sistemas no puede contener ciclos", 400);
    }

    const parents: System[] = [];
    for (const parentId of input.parentIds) {
      const ancestry = await this.systemRepository.getAncestry(parentId);
      const parent = ancestry[0];
      if (!parent) {
        throw new AppError("El sistema padre no existe o está eliminado", 400);
      }
      this.assertCanInherit(parent, input.publisher);
      this.assertParentKind(input.kind, resolveSystemKind(parent.kind));
      parents.push(parent);
    }

    await this.assertUniqueBaseForNode(input, parents);

    if (input.kind === "campaign" && input.id) {
      const hasChildren = await this.systemRepository.hasChildren(input.id);
      if (hasChildren) {
        throw new AppError("Un sistema de tipo campaign no puede tener sistemas hijos", 400);
      }
    }
  }

  private async assertUniqueBaseForNode(input: HierarchyInput, parents: System[]): Promise<void> {
    const nodeId = input.id ?? PENDING_SYSTEM_ID;
    const graph = await this.collectAncestryGraph(input.parentIds);

    graph.set(nodeId, {
      _id: { toString: () => nodeId } as System["_id"],
      name: nodeId,
      description: "",
      publisher: input.publisher,
      isOpen: false,
      isBase: input.isBase,
      kind: input.kind,
      parentIds: input.parentIds as unknown as System["parentIds"],
    });

    for (const parent of parents) {
      if (!graph.has(parent._id.toString())) {
        graph.set(parent._id.toString(), parent);
      }
    }

    const parentsOf = parentsOfFromSystems(
      [...graph.values()].map((system) => ({
        id: system._id.toString(),
        parentIds: system._id.toString() === nodeId
          ? input.parentIds
          : parentIdStrings(system.parentIds),
      }))
    );

    const baseIds = baseIdSet(graph);
    if (input.isBase) {
      baseIds.add(nodeId);
    } else {
      baseIds.delete(nodeId);
    }

    const idsToCheck = input.isBase && input.parentIds.length > 0
      ? linearize(input.parentIds, parentsOf)
      : linearize([nodeId], parentsOf);
    const bases = mostSpecificBases(idsToCheck, parentsOf, baseIds);

    if (bases.length !== 1) {
      throw new AppError("Los sistemas deben resolver a una única base más específica", 400);
    }
  }

  private async revalidateDescendants(
    id: string,
    override: { parentIds: string[]; isBase: boolean }
  ): Promise<void> {
    const descendants = await this.collectDescendants(id);
    for (const descendant of descendants) {
      await this.assertUniqueBaseWithOverride(descendant, { id, ...override });
    }
  }

  private async assertUniqueBaseWithOverride(
    descendant: System,
    override: { id: string; parentIds: string[]; isBase: boolean }
  ): Promise<void> {
    const descendantId = descendant._id.toString();
    const graph = await this.collectAncestryGraph([descendantId, ...override.parentIds]);
    const overlayed = [...graph.values()].map((system) => {
      if (system._id.toString() !== override.id) return system;
      return {
        ...system,
        isBase: override.isBase,
        parentIds: override.parentIds as unknown as System["parentIds"],
      };
    });

    const parentsOf = parentsOfFromSystems(
      overlayed.map((system) => ({
        id: system._id.toString(),
        parentIds: parentIdStrings(system.parentIds),
      }))
    );
    const bases = mostSpecificBases(
      linearize([descendantId], parentsOf),
      parentsOf,
      new Set(overlayed.filter((system) => system.isBase).map((system) => system._id.toString()))
    );
    if (bases.length !== 1) {
      throw new AppError(
        `El cambio dejaría el sistema '${descendant.name}' con más de una base más específica`,
        400
      );
    }
  }

  private async collectAncestryGraph(systemIds: string[]): Promise<Map<string, System>> {
    const graph = new Map<string, System>();
    for (const systemId of systemIds) {
      const ancestry = await this.systemRepository.getAncestry(systemId);
      for (const node of ancestry) {
        graph.set(node._id.toString(), node);
      }
    }
    return graph;
  }

  private async collectDescendants(id: string): Promise<System[]> {
    const result: System[] = [];
    const queue = [id];
    const seen = new Set<string>([id]);

    while (queue.length > 0) {
      const current = queue.shift()!;
      const children = await this.systemRepository.getChildren(current);
      for (const child of children) {
        const childId = child._id.toString();
        if (seen.has(childId)) continue;
        seen.add(childId);
        result.push(child);
        queue.push(childId);
      }
    }

    return result;
  }

  private assertContentLayerHasNoRules(
    kind: SystemKind,
    incoming: Record<string, unknown>,
    stored?: Record<string, unknown>
  ): void {
    if (kind === "ruleset") return;

    const becomingContentLayer = stored !== undefined
      && resolveSystemKind(stored.kind as string | undefined) !== kind;
    const offenders = new Set<string>();

    for (const key of SYSTEM_RULE_FIELD_KEYS) {
      if (ruleFieldIsSet(incoming[key])) {
        offenders.add(key);
      }
      if (becomingContentLayer && ruleFieldIsSet(stored?.[key])) {
        offenders.add(key);
      }
    }

    if (offenders.size > 0) {
      throw new AppError(
        `Los sistemas de tipo ${kind} no pueden definir reglas: ${Array.from(offenders).join(", ")}`,
        400
      );
    }
  }

  private assertBaseFlag(kind: SystemKind, isBase: boolean): void {
    if (isBase && kind !== "ruleset") {
      throw new AppError("isBase solo está permitido en sistemas de tipo ruleset", 400);
    }
  }

  private assertCanInherit(parent: System, publisher: string): void {
    if (!parent.isOpen && parent.publisher !== publisher) {
      throw new AppError("No tienes permiso para usar este sistema como padre", 403);
    }
  }

  private assertParentKind(childKind: SystemKind, parentKind: SystemKind): void {
    if (parentKind === "campaign") {
      throw new AppError("Un sistema de tipo campaign no puede ser padre", 400);
    }

    if (childKind === "ruleset" && parentKind !== "ruleset") {
      throw new AppError("Un ruleset solo puede tener como padre otro ruleset", 400);
    }
  }

  private async assertCatalogExclusions(input: {
    excludedRaceIds?: string[];
    excludedClassIds?: string[];
    parentIds: string[];
    systemId?: string;
  }): Promise<void> {
    const raceIds = input.excludedRaceIds ?? [];
    const classIds = input.excludedClassIds ?? [];
    if (raceIds.length === 0 && classIds.length === 0) return;

    const ancestorRulesets = await this.expandedAncestorRulesets(input.parentIds, input.systemId);

    for (const raceId of raceIds) {
      if (!this.raceRepository) {
        throw new AppError("La raza excluida no existe", 400);
      }
      const race = await this.raceRepository.getById(raceId);
      if (!race) {
        throw new AppError("La raza excluida no existe", 400);
      }
      if (!this.rulesetBelongsToAncestors(race.ruleset, ancestorRulesets, input.systemId)) {
        throw new AppError("Solo se pueden excluir razas de sistemas ancestros", 400);
      }
    }

    for (const classId of classIds) {
      if (!this.characterClassRepository) {
        throw new AppError("La clase excluida no existe", 400);
      }
      const characterClass = await this.characterClassRepository.getById(classId);
      if (!characterClass || characterClass.deletedAt) {
        throw new AppError("La clase excluida no existe", 400);
      }
      if (!this.rulesetBelongsToAncestors(characterClass.ruleset, ancestorRulesets, input.systemId)) {
        throw new AppError("Solo se pueden excluir clases de sistemas ancestros", 400);
      }
    }
  }

  private async expandedAncestorRulesets(parentIds: string[], systemId?: string): Promise<Set<string>> {
    const allowed = new Set<string>();
    const graph = await this.collectAncestryGraph(parentIds);
    for (const node of graph.values()) {
      const id = node._id.toString();
      if (systemId && id === systemId) continue;
      allowed.add(id);
      if (node.name) allowed.add(node.name);
    }
    return allowed;
  }

  private rulesetBelongsToAncestors(
    ruleset: string,
    ancestorRulesets: Set<string>,
    systemId?: string
  ): boolean {
    if (systemId && (ruleset === systemId)) return false;
    return ancestorRulesets.has(ruleset);
  }

  private async raceAncestorIds(raceId: string): Promise<string[]> {
    if (!this.raceRepository) return [];

    const chain: string[] = [];
    const seen = new Set<string>();
    let currentId: string | null | undefined = raceId;

    while (currentId) {
      if (seen.has(currentId)) break;
      seen.add(currentId);
      const race = await this.raceRepository.getById(currentId);
      const parentId = race?.parentId ? race.parentId.toString() : null;
      if (!parentId) break;
      chain.push(parentId);
      currentId = parentId;
    }

    return chain;
  }

  private async assertAbilityScoreAlternativeGroup(
    groupId: string | null | undefined,
    rulesets: string[]
  ): Promise<void> {
    if (!groupId || !this.optionGroupService) return;

    const group = await this.optionGroupService.getById(groupId);
    if (!group) {
      throw new AppError("Grupo de opciones no encontrado", 404);
    }

    const catalog = await this.optionGroupService.getBySystems(rulesets);
    if (!catalog.some(item => item.id === groupId)) {
      throw new AppError("El grupo de opciones no pertenece a este sistema ni a sus ancestros", 400);
    }
  }
}

function baseIdSet(graph: Map<string, System>): Set<string> {
  return new Set(
    [...graph.values()].filter((system) => system.isBase).map((system) => system._id.toString())
  );
}

function ruleFieldIsSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
