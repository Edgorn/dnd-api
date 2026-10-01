import { describe, it, expect } from "vitest";
import { resolveTraitInnateSpells } from "./resolveTraitInnateSpells";

const innateSpells = {
  abilityId: "cha",
  grants: [
    { spellId: "thaumaturgy", atLevel: 1, slotLevel: "spellLevel" as const, uses: "unlimited" as const, recharge: null },
    { spellId: "hellish-rebuke", atLevel: 3, slotLevel: 2, uses: 1, recharge: "longRest" as const },
    { spellId: "darkness", atLevel: 5, slotLevel: "spellLevel" as const, uses: 1, recharge: "longRest" as const }
  ]
};

describe("resolveTraitInnateSpells", () => {
  it("returns undefined when the trait has no innate spells", () => {
    expect(resolveTraitInnateSpells(undefined, 5)).toBeUndefined();
    expect(resolveTraitInnateSpells(null, 5)).toBeUndefined();
  });

  it("keeps grants whose atLevel is at most the character level", () => {
    const at1 = resolveTraitInnateSpells(innateSpells, 1);
    const at3 = resolveTraitInnateSpells(innateSpells, 3);
    const at5 = resolveTraitInnateSpells(innateSpells, 5);

    expect(at1?.grants.map(grant => grant.spellId)).toEqual(["thaumaturgy"]);
    expect(at3?.grants.map(grant => grant.spellId)).toEqual(["thaumaturgy", "hellish-rebuke"]);
    expect(at5?.grants.map(grant => grant.spellId)).toEqual(["thaumaturgy", "hellish-rebuke", "darkness"]);
  });

  it("preserves abilityId on the filtered result", () => {
    const resolved = resolveTraitInnateSpells(innateSpells, 1);

    expect(resolved?.abilityId).toBe("cha");
    expect(resolved?.grants).toHaveLength(1);
  });
});
