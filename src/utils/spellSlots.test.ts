import { describe, expect, it } from "vitest";
import {
  applyRecoverClassSpellSlots,
  applySpendSpellSlot,
  applySpellSlotRecovery,
  normalizeSpellSlotsSpent,
  slotPoolsFromSources,
  toSpellSlotsApi,
} from "./spellSlots";

const wizard = { class: "wizard", slots: { slots: { "1": 4, "2": 3 } } };
const warlock = { class: "warlock", slots: { fixedLevelSlots: { count: 2, level: 3 } } };
const pools = slotPoolsFromSources([wizard, warlock]);

describe("slotPoolsFromSources", () => {
  it("splits standard tables and uniform pools per class", () => {
    expect(pools).toEqual([
      { classId: "wizard", pool: "standard", level: 1, total: 4 },
      { classId: "wizard", pool: "standard", level: 2, total: 3 },
      { classId: "warlock", pool: "fixedLevel", level: 3, total: 2 },
    ]);
  });
});

describe("normalizeSpellSlotsSpent", () => {
  it("drops unknown pools and clips spent to total", () => {
    expect(normalizeSpellSlotsSpent(
      [
        { classId: "wizard", pool: "standard", level: 1, spent: 9 },
        { classId: "ghost", pool: "standard", level: 1, spent: 1 },
        { classId: "warlock", pool: "fixedLevel", level: 3, spent: 0 },
      ],
      pools
    )).toEqual([{ classId: "wizard", pool: "standard", level: 1, spent: 4 }]);
  });
});

describe("toSpellSlotsApi", () => {
  it("derives remaining from the class table", () => {
    expect(toSpellSlotsApi(pools, [{ classId: "warlock", pool: "fixedLevel", level: 3, spent: 1 }])).toEqual([
      { classId: "wizard", pool: "standard", level: 1, total: 4, spent: 0, remaining: 4 },
      { classId: "wizard", pool: "standard", level: 2, total: 3, spent: 0, remaining: 3 },
      { classId: "warlock", pool: "fixedLevel", level: 3, total: 2, spent: 1, remaining: 1 },
    ]);
  });
});

describe("applySpendSpellSlot", () => {
  it("spends one slot from the matching pool", () => {
    const first = applySpendSpellSlot({
      classId: "wizard",
      pool: "standard",
      level: 1,
      pools,
      spent: [],
    });
    expect(first).toEqual({
      ok: true,
      spent: [{ classId: "wizard", pool: "standard", level: 1, spent: 1 }],
    });

    const second = applySpendSpellSlot({
      classId: "wizard",
      pool: "standard",
      level: 1,
      pools,
      spent: first.ok ? first.spent : [],
    });
    expect(second.ok && second.spent).toEqual([
      { classId: "wizard", pool: "standard", level: 1, spent: 2 },
    ]);
  });

  it("rejects when no slots remain", () => {
    expect(applySpendSpellSlot({
      classId: "warlock",
      pool: "fixedLevel",
      level: 3,
      pools,
      spent: [{ classId: "warlock", pool: "fixedLevel", level: 3, spent: 2 }],
    })).toEqual({ ok: false, message: "No quedan ranuras de ese nivel" });
  });

  it("rejects an unknown class or level", () => {
    expect(applySpendSpellSlot({
      classId: "wizard",
      pool: "fixedLevel",
      level: 3,
      pools,
      spent: [],
    })).toEqual({ ok: false, message: "El personaje no tiene esas ranuras" });
  });
});

describe("applySpellSlotRecovery", () => {
  const spent = [
    { classId: "wizard", pool: "standard" as const, level: 1, spent: 2 },
    { classId: "warlock", pool: "fixedLevel" as const, level: 3, spent: 1 },
  ];

  it("clears only the recovered pools", () => {
    expect(applySpellSlotRecovery(spent, ["fixedLevel"])).toEqual([
      { classId: "wizard", pool: "standard", level: 1, spent: 2 },
    ]);
  });

  it("clears both pools when a long rest recovers them", () => {
    expect(applySpellSlotRecovery(spent, ["standard", "fixedLevel"])).toEqual([]);
  });

  it("keeps spent when nothing recovers", () => {
    expect(applySpellSlotRecovery(spent, [])).toEqual(spent);
  });
});

describe("applyRecoverClassSpellSlots", () => {
  const spent = [
    { classId: "wizard", pool: "standard" as const, level: 1, spent: 2 },
    { classId: "warlock", pool: "fixedLevel" as const, level: 3, spent: 2 },
  ];

  it("clears only the granting class pool", () => {
    expect(applyRecoverClassSpellSlots(spent, { classId: "warlock", pool: "fixedLevel" })).toEqual([
      { classId: "wizard", pool: "standard", level: 1, spent: 2 },
    ]);
  });

  it("does not clear the same pool on another class", () => {
    const twoUniforms = [
      ...spent,
      { classId: "hexblade", pool: "fixedLevel" as const, level: 1, spent: 1 },
    ];
    expect(applyRecoverClassSpellSlots(twoUniforms, { classId: "warlock", pool: "fixedLevel" })).toEqual([
      { classId: "wizard", pool: "standard", level: 1, spent: 2 },
      { classId: "hexblade", pool: "fixedLevel", level: 1, spent: 1 },
    ]);
  });
});
