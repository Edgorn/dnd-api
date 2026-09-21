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

describe("CreateTraitSchema speed", () => {
  it("accepts Fleet of Foot style set walk", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Pies Veloces",
      speed: { set: { walk: 35 } },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty speed object", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      speed: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects a condition other than always", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      speed: { add: { walk: 10 }, condition: "notHeavyArmor" },
    });
    expect(result.success).toBe(false);
  });

  it("accepts suppressedByArmorTypeIds and acFormula", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Defensa sin armadura",
      acFormula: "10 + @attributes.dex.modifier + @attributes.con.modifier",
      suppressedByArmorTypeIds: ["507f1f77bcf86cd799439011"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid suppressedByArmorTypeIds value", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Defensa sin armadura",
      suppressedByArmorTypeIds: ["not-an-id"],
    });
    expect(result.success).toBe(false);
  });

  it("accepts null acFormula and suppressedByArmorTypeIds", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Sentidos Divinos",
      acFormula: null,
      suppressedByArmorTypeIds: null,
    });
    expect(result.success).toBe(true);
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

describe("UpdateTraitSchema nullable armor fields", () => {
  it("accepts null acFormula and suppressedByArmorTypeIds on full edit payload", () => {
    const result = UpdateTraitSchema.safeParse({
      name: "Sentidos Divinos",
      description: ["párrafo"],
      summary: ["resumen"],
      incompatible_traits: [],
      proficiencies: [],
      skills: [],
      spellPrivileges: [],
      acFormula: null,
      suppressedByArmorTypeIds: null,
      ruleset: "507f1f77bcf86cd799439011",
    });
    expect(result.success).toBe(true);
  });
});

describe("CreateTraitSchema companionRoster", () => {
  it("accepts a UI hint with suggested roles", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Siervos",
      companionRoster: {
        count: 3,
        suggestedRoles: ["Mayordomo", "Mensajero", "Asistente"],
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a count outside 1..20", () => {
    const tooLow = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Siervos",
      companionRoster: { count: 0 },
    });
    const tooHigh = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Siervos",
      companionRoster: { count: 21 },
    });
    expect(tooLow.success).toBe(false);
    expect(tooHigh.success).toBe(false);
  });
});

describe("UpdateTraitSchema companionRoster", () => {
  it("accepts updating only companionRoster", () => {
    const result = UpdateTraitSchema.safeParse({
      companionRoster: { count: 2 },
    });
    expect(result.success).toBe(true);
  });
});
