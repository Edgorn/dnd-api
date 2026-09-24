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

const druidRestriction = {
  forbiddenMaterials: ["metal"],
  unlessMaterials: ["mithral"],
  scopes: ["armor", "shield"],
  enforcement: "block",
};

describe("CreateTraitSchema equipmentRestriction", () => {
  it("accepts a material restriction", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Druidas",
      equipmentRestriction: druidRestriction,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null to clear the restriction", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Druidas",
      equipmentRestriction: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown material in the restriction", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Druidas",
      equipmentRestriction: {
        ...druidRestriction,
        forbiddenMaterials: ["adamantine"],
      },
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateTraitSchema equipmentRestriction", () => {
  it("accepts null to clear the restriction", () => {
    const result = UpdateTraitSchema.safeParse({
      equipmentRestriction: null,
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

const damageTypeId = "507f1f77bcf86cd799439011";

const damageChoices = [{
  key: "ancestor",
  choose: 1,
  options: [
    { name: "Rojo", damageTypeId },
    { name: "Oro", damageTypeId },
  ],
}];

describe("CreateTraitSchema languages and damage choices", () => {
  it("accepts fixed languages and a damage table that reuses a damage type", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Ascendencia",
      languages: { speaks: ["draconic"], understands: ["draconic"] },
      damageChoices,
    });
    expect(result.success).toBe(true);
  });

  it("accepts a reference that consumes another trait table", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Resistencia",
      damageChoiceRef: { traitId: "draconic-ancestry", choiceKey: "ancestor", grantsResistance: true },
    });
    expect(result.success).toBe(true);
  });

  it("accepts null to clear languages, damage choices and the reference", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      languages: null,
      damageChoices: null,
      damageChoiceRef: null,
    });
    expect(result.success).toBe(true);
  });

  it("rejects notes and language choices on languages", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      languages: { speaks: [], understands: [], notes: "secreto" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a choose larger than the number of options", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      damageChoices: [{ ...damageChoices[0], choose: 3 }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicated choice keys and row names", () => {
    const duplicatedKey = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      damageChoices: [damageChoices[0], { ...damageChoices[0], key: "ancestor" }],
    });
    const duplicatedRow = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      damageChoices: [{
        key: "ancestor",
        choose: 1,
        options: [
          { name: "Rojo", damageTypeId },
          { name: "Rojo", damageTypeId },
        ],
      }],
    });
    const duplicatedNameAcrossChoices = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      damageChoices: [
        damageChoices[0],
        { key: "other", choose: 1, options: [{ name: "Rojo", damageTypeId }] },
      ],
    });
    expect(duplicatedKey.success).toBe(false);
    expect(duplicatedRow.success).toBe(false);
    expect(duplicatedNameAcrossChoices.success).toBe(false);
  });

  it("rejects an option without a damage type id", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      damageChoices: [{
        key: "ancestor",
        choose: 1,
        options: [{ name: "Rojo" }],
      }],
    });
    expect(result.success).toBe(false);
  });
});

const favoredTerrain = {
  key: "favoredTerrain",
  options: ["Ártico", "Bosque", "Costa", "Desierto", "Montaña", "Pantano", "Pradera"].map(name => ({ name })),
  grants: [
    { atLevel: 1, choose: 1 },
    { atLevel: 6, choose: 1 },
    { atLevel: 10, choose: 1 },
  ],
};

describe("CreateTraitSchema catalog choices", () => {
  it("accepts a favored terrain catalog", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Explorador nato",
      catalogChoices: [favoredTerrain],
    });
    expect(result.success).toBe(true);
  });

  it("rejects duplicated option names", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Explorador nato",
      catalogChoices: [{
        ...favoredTerrain,
        options: [{ name: "Bosque" }, { name: "Bosque" }],
      }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a grant that chooses zero", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Explorador nato",
      catalogChoices: [{
        ...favoredTerrain,
        grants: [{ atLevel: 1, choose: 0 }],
      }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicated grant levels", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Explorador nato",
      catalogChoices: [{
        ...favoredTerrain,
        grants: [
          { atLevel: 1, choose: 1 },
          { atLevel: 1, choose: 1 },
        ],
      }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a choose sum larger than the options", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Explorador nato",
      catalogChoices: [{
        key: "favoredTerrain",
        options: [{ name: "Bosque" }, { name: "Costa" }],
        grants: [
          { atLevel: 1, choose: 1 },
          { atLevel: 6, choose: 1 },
          { atLevel: 10, choose: 1 },
        ],
      }],
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateTraitSchema languages and damage choices", () => {
  it("accepts null to clear the damage table", () => {
    const result = UpdateTraitSchema.safeParse({ damageChoices: null });
    expect(result.success).toBe(true);
  });
});

describe("UpdateTraitSchema catalog choices", () => {
  it("accepts null to clear the catalog", () => {
    const result = UpdateTraitSchema.safeParse({ catalogChoices: null });
    expect(result.success).toBe(true);
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

describe("CreateTraitSchema hitPoints", () => {
  it("accepts class and character scopes", () => {
    const classScope = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Resistencia dracónica",
      hitPoints: { perLevel: 1, scope: "class" },
    });
    const characterScope = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Dureza enana",
      hitPoints: { perLevel: 1, scope: "character" },
    });
    expect(classScope.success).toBe(true);
    expect(characterScope.success).toBe(true);
  });

  it("rejects perLevel below 1 and unknown keys", () => {
    const low = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      hitPoints: { perLevel: 0, scope: "character" },
    });
    const extra = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      hitPoints: { perLevel: 1, scope: "character", note: "x" },
    });
    expect(low.success).toBe(false);
    expect(extra.success).toBe(false);
  });

  it("accepts null to clear hitPoints on create", () => {
    const result = CreateTraitSchema.safeParse({
      ruleset: "sys1",
      name: "Rasgo",
      hitPoints: null,
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateTraitSchema hitPoints", () => {
  it("accepts null to clear hitPoints", () => {
    const result = UpdateTraitSchema.safeParse({ hitPoints: null });
    expect(result.success).toBe(true);
  });
});
