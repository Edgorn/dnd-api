import { SPELL_SLOT_POOLS, SpellSlotPool, SystemRestRules } from "../types/system.types";

export interface RestRulesIssue {
  message: string;
  path: (string | number)[];
}

export function isRestKey(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function collectTraitRestKeys(trait: {
  action?: { recharge?: string | null } | null;
  spellPrivileges?: Array<{ freeCast?: { recharge?: string | null } | null }> | null;
  innateSpells?: { grants?: Array<{ recharge?: string | null }> } | null;
  damageChoices?: Array<{ replaceOn?: string }> | null;
}): string[] {
  const keys = new Set<string>();
  const add = (value: string | null | undefined) => {
    if (isRestKey(value)) keys.add(value);
  };

  add(trait.action?.recharge);
  for (const privilege of trait.spellPrivileges ?? []) {
    add(privilege.freeCast?.recharge);
  }
  for (const grant of trait.innateSpells?.grants ?? []) {
    add(grant.recharge);
  }
  for (const choice of trait.damageChoices ?? []) {
    add(choice.replaceOn);
  }

  return [...keys];
}

export function collectConditionRestKeys(condition: {
  recovery?: Array<{ restKey?: string | null }> | null;
}): string[] {
  const keys = new Set<string>();
  for (const entry of condition.recovery ?? []) {
    if (isRestKey(entry.restKey)) keys.add(entry.restKey);
  }
  return [...keys];
}

export function restKeysRejection(
  keys: string[],
  rules: SystemRestRules | undefined
): string | null {
  if (keys.length === 0) return null;
  if (!rules?.kinds?.length) {
    return "Este sistema no define descansos";
  }

  const defined = new Set(rules.kinds.map((kind) => kind.key));
  const unknown = keys.filter((key) => !defined.has(key));
  if (unknown.length === 0) return null;
  return `Clave de recarga desconocida: ${unknown.join(", ")}`;
}

export function characterRestRejection(
  rules: SystemRestRules | undefined,
  type: string
): string | null {
  if (!isRestKey(type)) {
    return "El descanso debe indicar un tipo";
  }
  if (!rules?.kinds?.length) {
    return "Este sistema no define descansos";
  }
  if (!rules.kinds.some((kind) => kind.key === type)) {
    return "Tipo de descanso inválido";
  }
  return null;
}

export function restKindCovers(
  rules: SystemRestRules | undefined,
  executedKey: string,
  rechargeKey: string | null | undefined
): boolean {
  if (!isRestKey(rechargeKey) || !isRestKey(executedKey)) return false;
  if (executedKey === rechargeKey) return true;
  if (!rules?.kinds?.length) return false;

  const includes = new Map(rules.kinds.map((kind) => [kind.key, kind.includes ?? []]));
  const seen = new Set<string>();
  const stack = [executedKey];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (seen.has(current)) continue;
    seen.add(current);
    if (current === rechargeKey) return true;
    for (const child of includes.get(current) ?? []) {
      stack.push(child);
    }
  }

  return false;
}

export function assertRestRulesShape(rules: SystemRestRules): RestRulesIssue[] {
  const issues: RestRulesIssue[] = [];
  const kinds = rules.kinds ?? [];
  const seenKeys = new Set<string>();

  kinds.forEach((kind, index) => {
    if (seenKeys.has(kind.key)) {
      issues.push({
        message: `restRules.kinds contiene la clave duplicada ${kind.key}`,
        path: ["kinds", index, "key"],
      });
    }
    seenKeys.add(kind.key);
  });

  kinds.forEach((kind, index) => {
    (kind.includes ?? []).forEach((included, includeIndex) => {
      if (!seenKeys.has(included)) {
        issues.push({
          message: `includes apunta a una clave inexistente: ${included}`,
          path: ["kinds", index, "includes", includeIndex],
        });
      }
    });
  });

  const graph = new Map(kinds.map((kind) => [kind.key, kind.includes ?? []]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (key: string, trail: string[]): void => {
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      issues.push({
        message: `restRules.kinds contiene un ciclo: ${[...trail, key].join(" -> ")}`,
        path: ["kinds"],
      });
      return;
    }
    visiting.add(key);
    for (const next of graph.get(key) ?? []) {
      visit(next, [...trail, key]);
    }
    visiting.delete(key);
    visited.add(key);
  };

  for (const key of seenKeys) {
    visit(key, []);
  }

  (rules.endStancesOn ?? []).forEach((key, index) => {
    if (!seenKeys.has(key)) {
      issues.push({
        message: `endStancesOn apunta a una clave inexistente: ${key}`,
        path: ["endStancesOn", index],
      });
    }
  });

  const recoveryKeys = new Set<string>();
  (rules.hitPointRecovery ?? []).forEach((entry, index) => {
    if (!seenKeys.has(entry.restKey)) {
      issues.push({
        message: `hitPointRecovery apunta a una clave inexistente: ${entry.restKey}`,
        path: ["hitPointRecovery", index, "restKey"],
      });
    }
    if (recoveryKeys.has(entry.restKey)) {
      issues.push({
        message: `hitPointRecovery contiene la clave duplicada ${entry.restKey}`,
        path: ["hitPointRecovery", index, "restKey"],
      });
    }
    recoveryKeys.add(entry.restKey);
  });

  const slotRecoveryKeys = new Set<string>();
  (rules.spellSlotRecovery ?? []).forEach((entry, index) => {
    if (!seenKeys.has(entry.restKey)) {
      issues.push({
        message: `spellSlotRecovery apunta a una clave inexistente: ${entry.restKey}`,
        path: ["spellSlotRecovery", index, "restKey"],
      });
    }
    if (slotRecoveryKeys.has(entry.restKey)) {
      issues.push({
        message: `spellSlotRecovery contiene la clave duplicada ${entry.restKey}`,
        path: ["spellSlotRecovery", index, "restKey"],
      });
    }
    slotRecoveryKeys.add(entry.restKey);

    if (!entry.pools?.length) {
      issues.push({
        message: "spellSlotRecovery.pools no puede estar vacío",
        path: ["spellSlotRecovery", index, "pools"],
      });
    }

    const seenPools = new Set<SpellSlotPool>();
    (entry.pools ?? []).forEach((pool, poolIndex) => {
      if (!SPELL_SLOT_POOLS.includes(pool)) {
        issues.push({
          message: `spellSlotRecovery.pools debe ser standard o uniform: ${pool}`,
          path: ["spellSlotRecovery", index, "pools", poolIndex],
        });
      }
      if (seenPools.has(pool)) {
        issues.push({
          message: `spellSlotRecovery.pools contiene el pool duplicado ${pool}`,
          path: ["spellSlotRecovery", index, "pools", poolIndex],
        });
      }
      seenPools.add(pool);
    });
  });

  return issues;
}

export function resolveHitPointRecovery(
  rules: SystemRestRules | undefined,
  executedKey: string
): { hp: "none" | "full"; hitDice: "none" | "all" | "half" } {
  const matching = (rules?.hitPointRecovery ?? []).filter((entry) =>
    restKindCovers(rules, executedKey, entry.restKey)
  );
  const hp = matching.some((entry) => entry.hp === "full") ? "full" : "none";
  const hitDice = matching.some((entry) => entry.hitDice === "all")
    ? "all"
    : matching.some((entry) => entry.hitDice === "half")
      ? "half"
      : "none";
  return { hp, hitDice };
}

export function resolveSpellSlotRecovery(
  rules: SystemRestRules | undefined,
  executedKey: string
): SpellSlotPool[] {
  const recovered = new Set<SpellSlotPool>();
  for (const entry of rules?.spellSlotRecovery ?? []) {
    if (!restKindCovers(rules, executedKey, entry.restKey)) continue;
    for (const pool of entry.pools ?? []) {
      recovered.add(pool);
    }
  }
  return SPELL_SLOT_POOLS.filter((pool) => recovered.has(pool));
}

export function restEndsStances(
  rules: SystemRestRules | undefined,
  executedKey: string
): boolean {
  const keys = rules?.endStancesOn ?? [];
  return keys.some((key) => restKindCovers(rules, executedKey, key));
}
