import { AppError } from "../errors/AppError";

export type SystemParentsMap = Map<string, string[]>;

export function parentIdStrings(
  parentIds: Array<{ toString(): string } | string> | undefined | null
): string[] {
  if (!parentIds) return [];
  return parentIds.map((id) => id.toString()).filter((id) => id.length > 0);
}

export function parentsOfFromSystems(
  systems: Array<{ id: string; parentIds: string[] }>
): SystemParentsMap {
  const parentsOf: SystemParentsMap = new Map();
  const known = new Set(systems.map((system) => system.id));
  for (const system of systems) {
    parentsOf.set(
      system.id,
      system.parentIds.filter((parentId) => known.has(parentId))
    );
  }
  return parentsOf;
}

export function linearize(startIds: string[], parentsOf: SystemParentsMap): string[] {
  const uniqueStarts = [...new Set(startIds.filter((id) => id.length > 0))];
  if (uniqueStarts.length === 0) return [];

  const memo = new Map<string, string[]>();
  const visiting = new Set<string>();

  const of = (id: string): string[] => linearizationOf(id, parentsOf, memo, visiting);

  if (uniqueStarts.length === 1) {
    return of(uniqueStarts[0]);
  }

  return merge(
    [...uniqueStarts.map(of), uniqueStarts],
    "No se puede linealizar la jerarquía de sistemas"
  );
}

export function mostSpecificBases(
  linearized: string[],
  parentsOf: SystemParentsMap,
  baseIds: Set<string>
): string[] {
  const reachable = linearized.filter((id) => baseIds.has(id));
  return reachable.filter(
    (baseId) => !reachable.some((other) => other !== baseId && isAncestor(other, baseId, parentsOf))
  );
}

export function isAncestor(
  descendantId: string,
  ancestorId: string,
  parentsOf: SystemParentsMap
): boolean {
  const stack = [...(parentsOf.get(descendantId) ?? [])];
  const seen = new Set<string>();

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === ancestorId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    stack.push(...(parentsOf.get(current) ?? []));
  }

  return false;
}

function linearizationOf(
  id: string,
  parentsOf: SystemParentsMap,
  memo: Map<string, string[]>,
  visiting: Set<string>
): string[] {
  const cached = memo.get(id);
  if (cached) return cached;

  if (visiting.has(id)) {
    throw new AppError("La jerarquía de sistemas no puede contener ciclos", 400);
  }

  visiting.add(id);
  const parents = parentsOf.get(id) ?? [];
  const parentLinearizations = parents.map((parentId) =>
    linearizationOf(parentId, parentsOf, memo, visiting)
  );
  const result = [
    id,
    ...merge(
      [...parentLinearizations, parents],
      "No se puede linealizar la jerarquía de sistemas"
    ),
  ];
  visiting.delete(id);
  memo.set(id, result);
  return result;
}

function merge(lists: string[][], conflictMessage: string): string[] {
  const copies = lists.map((list) => [...list]);
  const result: string[] = [];

  while (copies.some((list) => list.length > 0)) {
    const head = findGoodHead(copies);
    if (!head) {
      throw new AppError(conflictMessage, 400);
    }
    result.push(head);
    for (const list of copies) {
      if (list[0] === head) list.shift();
    }
  }

  return result;
}

function findGoodHead(lists: string[][]): string | undefined {
  for (const list of lists) {
    if (list.length === 0) continue;
    const candidate = list[0];
    const inSomeTail = lists.some((other) => other.slice(1).includes(candidate));
    if (!inSomeTail) return candidate;
  }
  return undefined;
}
