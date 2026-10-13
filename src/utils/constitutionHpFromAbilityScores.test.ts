import { describe, expect, it } from "vitest";
import {
  constitutionHitPointDelta,
  constitutionModifier
} from "./constitutionHpFromAbilityScores";

describe("constitutionHitPointDelta", () => {
  it("adds 2 HP per previous level when CON 20 becomes 24", () => {
    expect(constitutionHitPointDelta({
      before: [{ key: "con", modifier: 5 }],
      after: [{ key: "con", modifier: 7 }],
      previousLevels: 19
    })).toBe(38);
  });

  it("is 0 at character creation", () => {
    expect(constitutionHitPointDelta({
      before: [{ key: "con", modifier: 5 }],
      after: [{ key: "con", modifier: 7 }],
      previousLevels: 0
    })).toBe(0);
  });

  it("treats a missing modifier as 0", () => {
    expect(constitutionHitPointDelta({
      before: [{ key: "str", modifier: 3 }],
      after: [{ key: "con", modifier: 2 }],
      previousLevels: 4
    })).toBe(8);
  });
});

describe("constitutionModifier", () => {
  it("reads the con modifier", () => {
    expect(constitutionModifier([
      { key: "str", modifier: 4 },
      { key: "con", modifier: 5 }
    ])).toBe(5);
  });
});
