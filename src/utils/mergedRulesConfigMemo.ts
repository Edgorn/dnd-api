import { SystemRulesConfig } from "../domain/types/system.types";

export function rulesConfigCacheKey(systemIds: string[]): string {
  return [...new Set(systemIds.filter(Boolean))].sort().join("\0");
}

export function createMergedRulesConfigMemo(
  getMergedRulesConfig: (systemIds: string[]) => Promise<SystemRulesConfig>
): (systemIds: string[]) => Promise<SystemRulesConfig> {
  const cache = new Map<string, Promise<SystemRulesConfig>>();

  return (systemIds: string[]) => {
    const key = rulesConfigCacheKey(systemIds);
    const cached = cache.get(key);
    if (cached) return cached;

    const pending = getMergedRulesConfig(systemIds);
    cache.set(key, pending);
    return pending;
  };
}
