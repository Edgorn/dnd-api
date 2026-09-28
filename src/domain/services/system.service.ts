import ISystemRepository from '../repositories/ISystemRepository';
import {
  System,
  SystemKind,
  SystemRulesConfig,
  SYSTEM_RULE_FIELD_KEYS,
  TypeCrearSystem,
  TypeModificarSystem,
  resolveSystemKind,
} from '../types/system.types';
import { AppError } from '../errors/AppError';

type HierarchyInput = {
  kind: SystemKind;
  isBase: boolean;
  parentId?: string;
  publisher: string;
  id?: string;
  rulesSource: Record<string, unknown>;
  storedRulesSource?: Record<string, unknown>;
};

export default class SystemService {
  constructor(private readonly systemRepository: ISystemRepository) {}

  getByUserId(userId: string, accessibleSystemIds: string[], kind?: SystemKind): Promise<System[]> {
    return this.systemRepository.getByUserId(userId, accessibleSystemIds, kind);
  }

  async create(data: TypeCrearSystem): Promise<System | null> {
    const kind = resolveSystemKind(data.kind);
    const normalized: TypeCrearSystem = {
      ...data,
      kind,
      isBase: data.isBase ?? false,
    };

    await this.assertHierarchy({
      kind,
      isBase: normalized.isBase,
      parentId: normalized.parentId,
      publisher: normalized.publisher,
      rulesSource: normalized as unknown as Record<string, unknown>,
    });

    return this.systemRepository.create(normalized);
  }

  async update(data: TypeModificarSystem): Promise<System | null> {
    const system = await this.systemRepository.getById(data.id);
    if (!system) {
      throw new AppError('Sistema no encontrado', 404);
    }

    if (system.publisher !== data.userId) {
      throw new AppError('No tienes permisos de edición para este sistema', 403);
    }

    const kind = data.kind !== undefined ? resolveSystemKind(data.kind) : resolveSystemKind(system.kind);
    const isBase = data.isBase !== undefined ? data.isBase : system.isBase;
    const parentId = data.parentId !== undefined
      ? data.parentId || undefined
      : system.parentId?.toString();

    await this.assertHierarchy({
      kind,
      isBase,
      parentId,
      publisher: data.userId,
      id: data.id,
      rulesSource: data as unknown as Record<string, unknown>,
      storedRulesSource: system as unknown as Record<string, unknown>,
    });

    return this.systemRepository.update({ ...data, kind });
  }

  getById(id: string): Promise<System | null> {
    return this.systemRepository.getById(id);
  }

  getByIdWithDeleted(id: string): Promise<System | null> {
    return this.systemRepository.getByIdWithDeleted(id);
  }

  getAncestry(systemId: string): Promise<System[]> {
    return this.systemRepository.getAncestry(systemId);
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

  private async assertHierarchy(input: HierarchyInput): Promise<void> {
    this.assertContentLayerHasNoRules(input.kind, input.rulesSource, input.storedRulesSource);
    this.assertBaseFlag(input.kind, input.isBase);

    if ((input.kind === "setting" || input.kind === "campaign") && !input.parentId) {
      throw new AppError("Los sistemas de tipo setting y campaign requieren un sistema padre", 400);
    }

    if (input.parentId) {
      const parent = await this.assertParentChain(input.parentId, input.id);
      this.assertCanInherit(parent, input.publisher);
      this.assertParentKind(input.kind, resolveSystemKind(parent.kind));
    }

    if (input.kind === "campaign" && input.id) {
      const hasChildren = await this.systemRepository.hasChildren(input.id);
      if (hasChildren) {
        throw new AppError("Un sistema de tipo campaign no puede tener sistemas hijos", 400);
      }
    }
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

  private async assertParentChain(parentId: string, childId?: string): Promise<System> {
    const visited = new Set<string>();
    if (childId) visited.add(childId);

    const parent = await this.systemRepository.getById(parentId);
    if (!parent) {
      throw new AppError("El sistema padre no existe o está eliminado", 400);
    }

    let current: System | null = parent;
    while (current) {
      const currentId = current._id.toString();
      if (visited.has(currentId)) {
        throw new AppError("La jerarquía de sistemas no puede contener ciclos", 400);
      }
      visited.add(currentId);

      const nextId = current.parentId ? current.parentId.toString() : "";
      if (!nextId) break;
      current = await this.systemRepository.getById(nextId);
    }

    return parent;
  }
}

function ruleFieldIsSet(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}
