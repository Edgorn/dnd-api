import { describe, expect, it } from "vitest";
import {
  buildTraitGrantingClassLevels,
  lookupByClassLevel,
  resolveActionRemaining,
  resolveActionUses,
  resolveWeaponDamageAmount
} from "./traitProgression";

describe("lookupByClassLevel", () => {
  const rageUses = { "1": 2, "3": 3, "6": 4, "12": 5, "17": 6, "20": "unlimited" as const };

  it("picks the highest key less than or equal to the class level", () => {
    expect(lookupByClassLevel(rageUses, 1)).toBe(2);
    expect(lookupByClassLevel(rageUses, 5)).toBe(3);
    expect(lookupByClassLevel(rageUses, 20)).toBe("unlimited");
  });

  it("returns undefined when the map is empty or the level is below the first key", () => {
    expect(lookupByClassLevel(undefined, 5)).toBeUndefined();
    expect(lookupByClassLevel({ "3": 3 }, 2)).toBeUndefined();
  });
});

describe("resolveActionUses", () => {
  const action = {
    uses: 2,
    usesByClassLevel: { "1": 2, "3": 3, "6": 4 }
  };

  it("uses the class-level table when a granting class level is known", () => {
    expect(resolveActionUses(action, 5)).toBe(3);
  });

  it("falls back to action.uses for race or background traits", () => {
    expect(resolveActionUses(action, undefined)).toBe(2);
  });
});

describe("resolveWeaponDamageAmount", () => {
  const bonus = {
    when: "active" as const,
    melee: true,
    amount: 2,
    amountByClassLevel: { "1": 2, "9": 3, "16": 4 }
  };

  it("resolves the damage amount from the class-level table", () => {
    expect(resolveWeaponDamageAmount(bonus, 9)).toBe(3);
    expect(resolveWeaponDamageAmount(bonus, 8)).toBe(2);
  });
});

describe("resolveActionRemaining", () => {
  it("subtracts spent uses and never goes below zero", () => {
    expect(resolveActionRemaining(3, 1)).toBe(2);
    expect(resolveActionRemaining(2, 5)).toBe(0);
  });

  it("keeps unlimited remaining as unlimited", () => {
    expect(resolveActionRemaining("unlimited", 99)).toBe("unlimited");
  });
});

describe("buildTraitGrantingClassLevels", () => {
  it("maps each granted trait to the highest granting class level", () => {
    const map = buildTraitGrantingClassLevels(
      [
        { class: "barbarian", level: 5 },
        { class: "fighter", level: 3 }
      ],
      [
        {
          id: "barbarian",
          levels: [
            { level: 1, traits: ["rage"] },
            { level: 2, traits: ["reckless"] }
          ]
        },
        {
          id: "fighter",
          levels: [{ level: 1, traits: ["fighting-style"] }]
        }
      ],
      [
        {
          classId: "barbarian",
          levels: [{ level: 3, traits: [{ id: "bear-totem" }] }]
        }
      ]
    );

    expect(map.get("rage")).toBe(5);
    expect(map.get("reckless")).toBe(5);
    expect(map.get("bear-totem")).toBe(5);
    expect(map.get("fighting-style")).toBe(3);
    expect(map.has("unknown")).toBe(false);
  });
});
