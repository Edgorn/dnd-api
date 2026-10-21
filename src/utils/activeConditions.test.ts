import { describe, expect, it } from "vitest";
import {
  applyCondition,
  applyConditionDelta,
  applyConditionRestRecovery,
  immuneConditionIdsFromTraits,
  normalizeActiveConditions,
  removeCondition,
} from "./activeConditions";
import { SystemRestRules } from "../domain/types/system.types";

const exhaustion = {
  id: "exh",
  levels: [
    { level: 1, description: "Desventaja" },
    { level: 6, description: "Muerte" },
  ],
  recovery: [{ restKey: "longRest", delta: -1 }],
};
const poisoned = { id: "poison", levels: undefined as undefined };

const fivee: SystemRestRules = {
  kinds: [
    { key: "shortRest", name: "Corto" },
    { key: "longRest", name: "Largo", includes: ["shortRest"] },
  ],
};

describe("normalizeActiveConditions", () => {
  it("keeps the highest level per condition", () => {
    expect(normalizeActiveConditions([
      { conditionId: "exh", level: 2 },
      { conditionId: "poison" },
      { conditionId: "exh", level: 4 },
      { conditionId: "" },
    ])).toEqual([
      { conditionId: "exh", level: 4 },
      { conditionId: "poison" },
    ]);
  });
});

describe("immuneConditionIdsFromTraits", () => {
  it("includes permanent immunities and those of active stances", () => {
    expect([...immuneConditionIdsFromTraits([
      { id: "a", condition_inmunities: [{ id: "poison" }] },
      { id: "rage", conditionalConditionImmunities: [{ id: "charm" }] },
    ], ["rage"])].sort()).toEqual(["charm", "poison"]);
  });
});

describe("applyCondition", () => {
  it("adds a simple condition once", () => {
    expect(applyCondition({
      condition: poisoned,
      current: [],
      immuneIds: new Set(),
    })).toEqual({ ok: true, next: [{ conditionId: "poison" }] });
  });

  it("rejects a duplicate simple condition", () => {
    expect(applyCondition({
      condition: poisoned,
      current: [{ conditionId: "poison" }],
      immuneIds: new Set(),
    })).toEqual({ ok: false, message: "El personaje ya tiene este estado" });
  });

  it("adds exhaustion levels and caps at the catalog max", () => {
    const first = applyCondition({
      condition: exhaustion,
      current: [],
      addLevel: 2,
      immuneIds: new Set(),
    });
    expect(first).toEqual({ ok: true, next: [{ conditionId: "exh", level: 2 }] });
    expect(applyCondition({
      condition: exhaustion,
      current: first.ok ? first.next : [],
      addLevel: 9,
      immuneIds: new Set(),
    })).toEqual({ ok: true, next: [{ conditionId: "exh", level: 6 }] });
  });

  it("rejects an immune condition", () => {
    expect(applyCondition({
      condition: poisoned,
      current: [],
      immuneIds: new Set(["poison"]),
    })).toEqual({ ok: false, message: "El personaje es inmune a este estado" });
  });
});

describe("applyConditionDelta", () => {
  it("removes a leveled condition below 1", () => {
    expect(applyConditionDelta({
      condition: exhaustion,
      current: [{ conditionId: "exh", level: 1 }],
      delta: -1,
    })).toEqual({ ok: true, next: [] });
  });

  it("removes a simple condition with a negative delta", () => {
    expect(applyConditionDelta({
      condition: poisoned,
      current: [{ conditionId: "poison" }],
      delta: -1,
    })).toEqual({ ok: true, next: [] });
  });
});

describe("removeCondition", () => {
  it("drops the matching row", () => {
    expect(removeCondition([{ conditionId: "poison" }, { conditionId: "exh", level: 2 }], "poison"))
      .toEqual({ ok: true, next: [{ conditionId: "exh", level: 2 }] });
  });
});

describe("applyConditionRestRecovery", () => {
  it("reduces exhaustion on a long rest and ignores a short rest", () => {
    const current = [{ conditionId: "exh", level: 3 }, { conditionId: "poison" }];
    expect(applyConditionRestRecovery({
      current,
      catalogs: [exhaustion, poisoned],
      restType: "shortRest",
      restRules: fivee,
    })).toEqual(current);
    expect(applyConditionRestRecovery({
      current,
      catalogs: [exhaustion, poisoned],
      restType: "longRest",
      restRules: fivee,
    })).toEqual([{ conditionId: "exh", level: 2 }, { conditionId: "poison" }]);
  });

  it("removes a condition when recovery drops it below 1", () => {
    expect(applyConditionRestRecovery({
      current: [{ conditionId: "exh", level: 1 }],
      catalogs: [exhaustion],
      restType: "longRest",
      restRules: fivee,
    })).toEqual([]);
  });
});
