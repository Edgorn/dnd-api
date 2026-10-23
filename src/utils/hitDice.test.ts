import { describe, expect, it } from "vitest";
import {
  applyHitPointRecovery,
  applyRestHitDiceSpends,
  applySpendHitDice,
  classPoolsFromCharacter,
  halfHitDiceRecovered,
  maxHpFromHitDice,
  normalizeHitDiceSpent,
  toHitDiceApi,
} from "./hitDice";

const fighter = { classId: "fighter", level: 5, hitDie: 10 };
const wizard = { classId: "wizard", level: 3, hitDie: 6 };
const pools = [fighter, wizard];

describe("normalizeHitDiceSpent", () => {
  it("keeps positive spent for known classes", () => {
    expect(normalizeHitDiceSpent(
      [{ classId: "fighter", spent: 2 }, { classId: "ghost", spent: 1 }, { classId: "wizard", spent: 0 }],
      ["fighter", "wizard"]
    )).toEqual([{ classId: "fighter", spent: 2 }]);
  });
});

describe("toHitDiceApi", () => {
  it("derives remaining from level minus spent", () => {
    expect(toHitDiceApi(pools, [{ classId: "fighter", spent: 2 }], 2)).toEqual([
      { classId: "fighter", hitDie: 10, total: 5, spent: 2, remaining: 3, bonusPerDie: 2 },
      { classId: "wizard", hitDie: 6, total: 3, spent: 0, remaining: 3, bonusPerDie: 2 },
    ]);
  });
});

describe("classPoolsFromCharacter", () => {
  it("reads class and hit_die from stored rows", () => {
    expect(classPoolsFromCharacter([
      { class: "fighter", level: 5, hit_die: "10" },
      { class: "empty", level: 0, hit_die: 8 },
    ])).toEqual([fighter]);
  });
});

describe("applySpendHitDice", () => {
  it("spends dice and clips HP to max", () => {
    const result = applySpendHitDice({
      classId: "fighter",
      count: 2,
      hpGained: 14,
      pools,
      spent: [],
      hpActual: 20,
      hpMax: 30,
      bonusPerDie: 2,
    });
    expect(result).toEqual({
      ok: true,
      spent: [{ classId: "fighter", spent: 2 }],
      hpActual: 30,
    });
  });

  it("rejects spending more dice than remain", () => {
    const result = applySpendHitDice({
      classId: "fighter",
      count: 4,
      hpGained: 1,
      pools,
      spent: [{ classId: "fighter", spent: 2 }],
      hpActual: 10,
      hpMax: 30,
      bonusPerDie: 2,
    });
    expect(result).toEqual({ ok: false, message: "No quedan dados de golpe de esta clase" });
  });

  it("rejects hpGained above count * (hitDie + modifier)", () => {
    expect(maxHpFromHitDice(2, 10, 3)).toBe(26);
    const result = applySpendHitDice({
      classId: "fighter",
      count: 2,
      hpGained: 27,
      pools,
      spent: [],
      hpActual: 1,
      hpMax: 40,
      bonusPerDie: 3,
    });
    expect(result).toEqual({
      ok: false,
      message: "Los PG recuperados (27) no pueden superar 26",
    });
  });

  it("allows a second spend after the first", () => {
    const first = applySpendHitDice({
      classId: "fighter",
      count: 2,
      hpGained: 10,
      pools,
      spent: [],
      hpActual: 5,
      hpMax: 40,
      bonusPerDie: 2,
    });
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = applySpendHitDice({
      classId: "fighter",
      count: 1,
      hpGained: 6,
      pools,
      spent: first.spent,
      hpActual: first.hpActual,
      hpMax: 40,
      bonusPerDie: 2,
    });
    expect(second).toEqual({
      ok: true,
      spent: [{ classId: "fighter", spent: 3 }],
      hpActual: 21,
    });
  });
});

describe("applyRestHitDiceSpends", () => {
  it("leaves HP and spent when there are no spends", () => {
    const spent = [{ classId: "fighter", spent: 1 }];
    expect(applyRestHitDiceSpends({
      allowed: false,
      pools,
      spent,
      hpActual: 8,
      hpMax: 40,
      bonusPerDie: 2,
    })).toEqual({ ok: true, spent, hpActual: 8 });
  });

  it("rejects spends when the rest does not allow them", () => {
    expect(applyRestHitDiceSpends({
      spends: [{ classId: "fighter", count: 1, hpGained: 8 }],
      allowed: false,
      pools,
      spent: [],
      hpActual: 8,
      hpMax: 40,
      bonusPerDie: 2,
    })).toEqual({ ok: false, message: "Este descanso no admite gastar dados de golpe" });
  });

  it("spends dice before a later hit-point recovery can run", () => {
    const spentResult = applyRestHitDiceSpends({
      spends: [{ classId: "fighter", count: 2, hpGained: 14 }],
      allowed: true,
      pools,
      spent: [],
      hpActual: 4,
      hpMax: 40,
      bonusPerDie: 2,
    });
    expect(spentResult).toEqual({
      ok: true,
      spent: [{ classId: "fighter", spent: 2 }],
      hpActual: 18,
    });
    if (!spentResult.ok) return;
    expect(applyHitPointRecovery({
      hp: "full",
      hitDice: "half",
      pools,
      spent: spentResult.spent,
      hpActual: spentResult.hpActual,
      hpMax: 40,
    })).toEqual({
      hpActual: 40,
      spent: [],
    });
  });
});

describe("applyHitPointRecovery", () => {
  it("restores full HP and half hit dice in class order", () => {
    expect(halfHitDiceRecovered(8)).toBe(4);
    const result = applyHitPointRecovery({
      hp: "full",
      hitDice: "half",
      pools,
      spent: [
        { classId: "fighter", spent: 5 },
        { classId: "wizard", spent: 2 },
      ],
      hpActual: 4,
      hpMax: 40,
    });
    expect(result).toEqual({
      hpActual: 40,
      spent: [
        { classId: "fighter", spent: 1 },
        { classId: "wizard", spent: 2 },
      ],
    });
  });

  it("recovers at least one die on half when total is 1", () => {
    const result = applyHitPointRecovery({
      hp: "none",
      hitDice: "half",
      pools: [{ classId: "wizard", level: 1, hitDie: 6 }],
      spent: [{ classId: "wizard", spent: 1 }],
      hpActual: 3,
      hpMax: 8,
    });
    expect(result).toEqual({ hpActual: 3, spent: [] });
  });

  it("clears all spent on all", () => {
    const result = applyHitPointRecovery({
      hp: "full",
      hitDice: "all",
      pools,
      spent: [{ classId: "fighter", spent: 3 }],
      hpActual: 1,
      hpMax: 20,
    });
    expect(result).toEqual({ hpActual: 20, spent: [] });
  });

  it("leaves HP and dice when both modes are none", () => {
    const spent = [{ classId: "fighter", spent: 2 }];
    expect(applyHitPointRecovery({
      hp: "none",
      hitDice: "none",
      pools,
      spent,
      hpActual: 7,
      hpMax: 20,
    })).toEqual({ hpActual: 7, spent });
  });
});
