import { describe, it, expect } from "vitest";
import { CreateTraitSchema, UpdateTraitSchema } from "../../../infrastructure/http/schemas/trait.schema";

const masteryPrivileges = [
  {
    choose: 1,
    source: "known",
    filter: { level: 1 },
    alwaysPrepared: false,
    countsTowardPreparedCap: true,
    freeCast: { slotLevel: "spellLevel", uses: "unlimited", recharge: null },
    replace: { hours: 8, sameLevel: true },
  },
  {
    choose: 1,
    source: "known",
    filter: { level: 2 },
    alwaysPrepared: false,
    countsTowardPreparedCap: true,
    freeCast: { slotLevel: "spellLevel", uses: "unlimited", recharge: null },
    replace: { hours: 8, sameLevel: true },
  },
];

describe("CreateTraitSchema spellPrivileges", () => {
  it("accepts mastery-style privilege rules", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Maestría sobre Conjuros",
      spellPrivileges: masteryPrivileges,
    });
    expect(result.success).toBe(true);
  });

  it("accepts signature-style privilege rules", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Conjuros característicos",
      spellPrivileges: [{
        choose: 2,
        source: "known",
        filter: { level: 3 },
        alwaysPrepared: true,
        countsTowardPreparedCap: false,
        freeCast: { slotLevel: "spellLevel", uses: 1, recharge: "shortOrLongRest" },
        replace: null,
      }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid source", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      spellPrivileges: [{
        choose: 1,
        source: "spellbook",
        filter: { level: 1 },
        alwaysPrepared: false,
        countsTowardPreparedCap: true,
        freeCast: null,
        replace: null,
      }],
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateTraitSchema spellPrivileges", () => {
  it("accepts updating only spellPrivileges", () => {
    const result = UpdateTraitSchema.safeParse({
      spellPrivileges: masteryPrivileges,
    });
    expect(result.success).toBe(true);
  });
});
