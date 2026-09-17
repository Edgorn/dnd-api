import { describe, it, expect } from "vitest";
import {
  hasAbilityScoreAtLevel,
  resolveAbilityScoreProgression
} from "./abilityScoreProgression";

const DEFAULT_5E = [4, 8, 12, 16, 19];
const FIGHTER = [4, 6, 8, 12, 14, 16, 19];

describe("resolveAbilityScoreProgression", () => {
  it("inherits the system default when the class has no override", () => {
    expect(resolveAbilityScoreProgression(undefined, DEFAULT_5E)).toEqual(DEFAULT_5E);
    expect(resolveAbilityScoreProgression(null, DEFAULT_5E)).toEqual(DEFAULT_5E);
  });

  it("uses the fighter override instead of the system default", () => {
    expect(resolveAbilityScoreProgression(FIGHTER, DEFAULT_5E)).toEqual(FIGHTER);
  });

  it("uses an empty class override to disable ASI", () => {
    expect(resolveAbilityScoreProgression([], DEFAULT_5E)).toEqual([]);
  });

  it("returns undefined when neither class nor system defines a table", () => {
    expect(resolveAbilityScoreProgression(undefined, undefined)).toBeUndefined();
  });
});

describe("hasAbilityScoreAtLevel", () => {
  it("matches resolved class levels", () => {
    expect(hasAbilityScoreAtLevel(4, DEFAULT_5E)).toBe(true);
    expect(hasAbilityScoreAtLevel(6, DEFAULT_5E)).toBe(false);
    expect(hasAbilityScoreAtLevel(6, FIGHTER)).toBe(true);
  });

  it("does not use the legacy flag when a resolved table exists", () => {
    expect(hasAbilityScoreAtLevel(4, [], true)).toBe(false);
  });

  it("falls back to the legacy ability_score flag when there is no table", () => {
    expect(hasAbilityScoreAtLevel(4, undefined, true)).toBe(true);
    expect(hasAbilityScoreAtLevel(4, undefined, false)).toBe(false);
    expect(hasAbilityScoreAtLevel(4, undefined)).toBe(false);
  });
});
