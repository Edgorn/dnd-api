export type CatalogAncestryNode = {
  _id: { toString(): string };
  name?: string;
};

export function ancestryRulesetKeys(ancestry: CatalogAncestryNode[]): string[] {
  const keys: string[] = [];
  for (const node of ancestry) {
    keys.push(node._id.toString());
    if (node.name) {
      keys.push(node.name);
    }
  }
  return keys;
}

export function resolveInheritedCatalog<T>(
  ancestry: CatalogAncestryNode[],
  items: T[],
  options: {
    identityOf: (item: T) => string;
    rulesetOf: (item: T) => string;
  }
): T[] {
  const resolved = new Map<string, T>();

  for (let i = ancestry.length - 1; i >= 0; i--) {
    const ancestor = ancestry[i];
    const ancestorRulesets = [ancestor._id.toString(), ancestor.name].filter(Boolean) as string[];

    for (const item of items) {
      if (!ancestorRulesets.includes(options.rulesetOf(item))) continue;
      resolved.set(options.identityOf(item), item);
    }
  }

  return Array.from(resolved.values());
}

export async function loadResolvedCatalogs<T>(
  rulesets: string[],
  getAncestry: (id: string) => Promise<CatalogAncestryNode[]>,
  loadItems: (keys: string[]) => Promise<T[]>,
  options: {
    identityOf: (item: T) => string;
    rulesetOf: (item: T) => string;
  }
): Promise<T[]> {
  const perRuleset = await Promise.all(
    rulesets.map(async (ruleset) => {
      const ancestry = await getAncestry(ruleset);
      if (ancestry.length === 0) {
        return loadItems([ruleset]);
      }
      const items = await loadItems(ancestryRulesetKeys(ancestry));
      return resolveInheritedCatalog(ancestry, items, options);
    })
  );
  return perRuleset.flat();
}
