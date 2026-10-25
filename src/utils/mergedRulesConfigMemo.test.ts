import { describe, expect, it, vi } from "vitest";
import { createMergedRulesConfigMemo, rulesConfigCacheKey } from "./mergedRulesConfigMemo";

describe("mergedRulesConfigMemo", () => {
  it("normalizes system ids regardless of order or duplicates", () => {
    expect(rulesConfigCacheKey(["b", "a", "a"])).toBe(rulesConfigCacheKey(["a", "b"]));
  });

  it("calls getMergedRulesConfig once per distinct system combination", async () => {
    const getMergedRulesConfig = vi.fn(async (ids: string[]) => ({
      xpProgression: [ids.length]
    }));
    const getRulesConfig = createMergedRulesConfigMemo(getMergedRulesConfig);

    const [first, second, third] = await Promise.all([
      getRulesConfig(["sys-a", "sys-b"]),
      getRulesConfig(["sys-b", "sys-a"]),
      getRulesConfig(["sys-c"])
    ]);

    expect(getMergedRulesConfig).toHaveBeenCalledTimes(2);
    expect(first).toBe(second);
    expect(third).not.toBe(first);
  });
});
