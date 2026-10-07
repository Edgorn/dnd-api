import { resolveSystemKind, System, SystemSummary } from "../../../domain/types/system.types";
import { parentIdStrings } from "../../../domain/services/systemHierarchy";

export function toSystemSummary(
  system: System,
  options: { publisherName: string; userId: string; racesCount: number }
): SystemSummary {
  return {
    id: system._id.toString(),
    name: system.name || "",
    description: system.description || "",
    publisher: options.publisherName,
    isOpen: !!system.isOpen,
    isBase: !!system.isBase,
    kind: resolveSystemKind(system.kind),
    parentIds: (system.parentIds ?? []).map((id) => id.toString()),
    canEdit: system.publisher === options.userId,
    racesCount: options.racesCount,
    deletedAt: system.deletedAt ?? null,
  };
}

export function rulesetKeysFromGraph(graph: Map<string, System>): string[] {
  const keys = new Set<string>();
  for (const system of graph.values()) {
    keys.add(system._id.toString());
    if (system.name) keys.add(system.name);
  }
  return [...keys];
}

export function sumRacesCountForSystem(
  system: System,
  graph: Map<string, System>,
  counts: Map<string, number>
): number {
  let total = 0;
  for (const key of ancestryRulesetKeys(system, graph)) {
    total += counts.get(key) ?? 0;
  }
  return total;
}

function ancestryRulesetKeys(system: System, graph: Map<string, System>): string[] {
  const keys = new Set<string>();
  const visited = new Set<string>();
  const stack = [system._id.toString()];

  while (stack.length > 0) {
    const id = stack.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);

    const node = graph.get(id);
    if (!node) continue;

    keys.add(id);
    if (node.name) keys.add(node.name);

    for (const parentId of parentIdStrings(node.parentIds)) {
      stack.push(parentId);
    }
  }

  return [...keys];
}
