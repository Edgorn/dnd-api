import { describe, expect, it } from "vitest";
import {
  assertRestRulesShape,
  characterRestRejection,
  collectConditionRestKeys,
  collectTraitRestKeys,
  restEndsStances,
  hitDiceSpendAllowed,
  resolveHitPointRecovery,
  resolveSpellSlotRecovery,
  restKindCovers,
  restKeysRejection,
} from "./restRules";
import { SystemRestRules } from "../types/system.types";

const fivee: SystemRestRules = {
  kinds: [
    { key: "shortRest", name: "Descanso corto" },
    { key: "longRest", name: "Descanso largo", includes: ["shortRest"] },
  ],
};

describe("assertRestRulesShape", () => {
  it("accepts unique keys and includes that exist", () => {
    expect(assertRestRulesShape(fivee)).toEqual([]);
  });

  it("accepts empty kinds", () => {
    expect(assertRestRulesShape({ kinds: [] })).toEqual([]);
  });

  it("rejects duplicate keys", () => {
    const issues = assertRestRulesShape({
      kinds: [
        { key: "shortRest", name: "Corto" },
        { key: "shortRest", name: "Otro" },
      ],
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "restRules.kinds contiene la clave duplicada shortRest",
        path: ["kinds", 1, "key"],
      }),
    ]);
  });

  it("rejects includes that point to a missing key", () => {
    const issues = assertRestRulesShape({
      kinds: [{ key: "longRest", name: "Largo", includes: ["shortRest"] }],
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "includes apunta a una clave inexistente: shortRest",
        path: ["kinds", 0, "includes", 0],
      }),
    ]);
  });

  it("rejects cycles", () => {
    const issues = assertRestRulesShape({
      kinds: [
        { key: "a", name: "A", includes: ["b"] },
        { key: "b", name: "B", includes: ["a"] },
      ],
    });
    expect(issues.some((issue) => issue.message.includes("ciclo"))).toBe(true);
  });

  it("accepts endStancesOn keys that exist in kinds", () => {
    expect(assertRestRulesShape({
      ...fivee,
      endStancesOn: ["shortRest"],
    })).toEqual([]);
  });

  it("rejects hitPointRecovery keys missing from kinds", () => {
    const issues = assertRestRulesShape({
      ...fivee,
      hitPointRecovery: [{ restKey: "watch", hp: "full", hitDice: "half" }],
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "hitPointRecovery apunta a una clave inexistente: watch",
        path: ["hitPointRecovery", 0, "restKey"],
      }),
    ]);
  });

  it("rejects spellSlotRecovery keys missing from kinds", () => {
    const issues = assertRestRulesShape({
      ...fivee,
      spellSlotRecovery: [{ restKey: "watch", pools: ["standard"] }],
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "spellSlotRecovery apunta a una clave inexistente: watch",
        path: ["spellSlotRecovery", 0, "restKey"],
      }),
    ]);
  });

  it("rejects empty spellSlotRecovery pools", () => {
    const issues = assertRestRulesShape({
      ...fivee,
      spellSlotRecovery: [{ restKey: "longRest", pools: [] }],
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "spellSlotRecovery.pools no puede estar vacío",
        path: ["spellSlotRecovery", 0, "pools"],
      }),
    ]);
  });

  it("accepts hitDiceSpending.on keys from kinds", () => {
    expect(assertRestRulesShape({
      ...fivee,
      hitDiceSpending: { on: ["shortRest"], bonusFormula: "@attributes.con.modifier" },
    })).toEqual([]);
  });

  it("rejects hitDiceSpending.on keys missing from kinds", () => {
    const issues = assertRestRulesShape({
      ...fivee,
      hitDiceSpending: { on: ["watch"] },
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "hitDiceSpending.on apunta a una clave inexistente: watch",
        path: ["hitDiceSpending", "on", 0],
      }),
    ]);
  });

  it("rejects duplicate hitDiceSpending.on keys", () => {
    const issues = assertRestRulesShape({
      ...fivee,
      hitDiceSpending: { on: ["shortRest", "shortRest"] },
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "hitDiceSpending.on contiene la clave duplicada shortRest",
        path: ["hitDiceSpending", "on", 1],
      }),
    ]);
  });

  it("rejects endStancesOn keys missing from kinds", () => {
    const issues = assertRestRulesShape({
      ...fivee,
      endStancesOn: ["watch"],
    });
    expect(issues).toEqual([
      expect.objectContaining({
        message: "endStancesOn apunta a una clave inexistente: watch",
        path: ["endStancesOn", 0],
      }),
    ]);
  });
});

describe("restEndsStances", () => {
  const withPolicy: SystemRestRules = { ...fivee, endStancesOn: ["shortRest"] };

  it("is false when endStancesOn is omitted", () => {
    expect(restEndsStances(fivee, "longRest")).toBe(false);
  });

  it("matches the listed rest key", () => {
    expect(restEndsStances(withPolicy, "shortRest")).toBe(true);
  });

  it("matches a rest that includes the listed key", () => {
    expect(restEndsStances(withPolicy, "longRest")).toBe(true);
  });

  it("does not match an unrelated rest", () => {
    const watchOnly: SystemRestRules = {
      kinds: [
        ...fivee.kinds,
        { key: "watch", name: "Vela" },
      ],
      endStancesOn: ["longRest"],
    };
    expect(restEndsStances(watchOnly, "shortRest")).toBe(false);
    expect(restEndsStances(watchOnly, "watch")).toBe(false);
  });
});

describe("hitDiceSpendAllowed", () => {
  const withSpend: SystemRestRules = {
    ...fivee,
    hitDiceSpending: { on: ["shortRest"] },
  };

  it("matches only the listed rest key", () => {
    expect(hitDiceSpendAllowed(withSpend, "shortRest")).toBe(true);
    expect(hitDiceSpendAllowed(withSpend, "longRest")).toBe(false);
  });

  it("is false when omitted", () => {
    expect(hitDiceSpendAllowed(fivee, "shortRest")).toBe(false);
    expect(hitDiceSpendAllowed(undefined, "shortRest")).toBe(false);
  });
});

describe("resolveHitPointRecovery", () => {
  const withRecovery: SystemRestRules = {
    ...fivee,
    hitPointRecovery: [
      { restKey: "shortRest", hp: "none", hitDice: "none" },
      { restKey: "longRest", hp: "full", hitDice: "half" },
    ],
  };

  it("uses the long rest row on a long rest", () => {
    expect(resolveHitPointRecovery(withRecovery, "longRest")).toEqual({
      hp: "full",
      hitDice: "half",
    });
  });

  it("keeps none on a short rest when that row is none", () => {
    expect(resolveHitPointRecovery(withRecovery, "shortRest")).toEqual({
      hp: "none",
      hitDice: "none",
    });
  });

  it("applies a short-rest recovery when a long rest includes it", () => {
    const onlyShort: SystemRestRules = {
      ...fivee,
      hitPointRecovery: [{ restKey: "shortRest", hp: "full", hitDice: "all" }],
    };
    expect(resolveHitPointRecovery(onlyShort, "longRest")).toEqual({
      hp: "full",
      hitDice: "all",
    });
  });
});

describe("resolveSpellSlotRecovery", () => {
  const withRecovery: SystemRestRules = {
    ...fivee,
    spellSlotRecovery: [
      { restKey: "shortRest", pools: ["uniform"] },
      { restKey: "longRest", pools: ["standard", "uniform"] },
    ],
  };

  it("recovers only uniform slots on a short rest", () => {
    expect(resolveSpellSlotRecovery(withRecovery, "shortRest")).toEqual(["uniform"]);
  });

  it("unions matching rows on a long rest that includes the short rest", () => {
    expect(resolveSpellSlotRecovery(withRecovery, "longRest")).toEqual(["standard", "uniform"]);
  });

  it("returns nothing when omitted", () => {
    expect(resolveSpellSlotRecovery(fivee, "longRest")).toEqual([]);
  });
});

describe("restKindCovers", () => {
  it("matches the same key", () => {
    expect(restKindCovers(fivee, "shortRest", "shortRest")).toBe(true);
    expect(restKindCovers(fivee, "longRest", "longRest")).toBe(true);
  });

  it("matches included keys transitively", () => {
    const watch: SystemRestRules = {
      kinds: [
        { key: "shortRest", name: "Corto" },
        { key: "longRest", name: "Largo", includes: ["shortRest"] },
        { key: "extendedRest", name: "Extendido", includes: ["longRest"] },
      ],
    };
    expect(restKindCovers(fivee, "longRest", "shortRest")).toBe(true);
    expect(restKindCovers(watch, "extendedRest", "shortRest")).toBe(true);
    expect(restKindCovers(fivee, "shortRest", "longRest")).toBe(false);
  });

  it("without rules only matches the exact key", () => {
    expect(restKindCovers(undefined, "longRest", "longRest")).toBe(true);
    expect(restKindCovers(undefined, "longRest", "shortRest")).toBe(false);
  });
});

describe("characterRestRejection", () => {
  it("rejects when the system has no rests", () => {
    expect(characterRestRejection(undefined, "longRest")).toBe("Este sistema no define descansos");
    expect(characterRestRejection({ kinds: [] }, "longRest")).toBe("Este sistema no define descansos");
  });

  it("rejects an unknown rest type", () => {
    expect(characterRestRejection(fivee, "watch")).toBe("Tipo de descanso inválido");
  });

  it("accepts a catalog key", () => {
    expect(characterRestRejection(fivee, "shortRest")).toBeNull();
  });
});

describe("restKeysRejection and collectTraitRestKeys", () => {
  it("collects recharge and replaceOn keys", () => {
    expect(collectTraitRestKeys({
      action: { recharge: "shortRest" },
      spellPrivileges: [{ freeCast: { recharge: "longRest" } }],
      innateSpells: { grants: [{ recharge: "shortRest" }] },
      damageChoices: [{ replaceOn: "longRest" }],
    })).toEqual(["shortRest", "longRest"]);
  });

  it("ignores a null action", () => {
    expect(collectTraitRestKeys({ action: null })).toEqual([]);
  });

  it("rejects keys when the system has no rests", () => {
    expect(restKeysRejection(["shortRest"], undefined)).toBe("Este sistema no define descansos");
  });

  it("rejects unknown keys", () => {
    expect(restKeysRejection(["watch"], fivee)).toBe("Clave de recarga desconocida: watch");
  });

  it("collects recovery keys from a condition", () => {
    expect(collectConditionRestKeys({
      recovery: [{ restKey: "longRest" }, { restKey: "shortRest" }]
    })).toEqual(["longRest", "shortRest"]);
  });
});
