import { describe, expect, it } from "vitest";
import { normalizeSpellCastingTimes } from "./normalizeSpellCastingTimes";

const action = { value: 1, unit: "action" };
const hours = { value: 8, unit: "hour" };

describe("normalizeSpellCastingTimes", () => {
  it("wraps a legacy castingTime object into an array", () => {
    expect(normalizeSpellCastingTimes({ castingTime: action })).toEqual([action]);
  });

  it("keeps an already migrated castingTimes array", () => {
    expect(normalizeSpellCastingTimes({
      castingTimes: [action, hours]
    })).toEqual([action, hours]);
  });

  it("prefers castingTimes when both fields are present", () => {
    expect(normalizeSpellCastingTimes({
      castingTimes: [hours],
      castingTime: action
    })).toEqual([hours]);
  });

  it("returns undefined when neither field is present", () => {
    expect(normalizeSpellCastingTimes({})).toBeUndefined();
  });
});
