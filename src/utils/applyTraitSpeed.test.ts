import { describe, expect, it } from "vitest";
import { applyTraitSpeed, normalizeTraitSpeed } from "./applyTraitSpeed";

describe("normalizeTraitSpeed", () => {
  it("maps a legacy number to set walk", () => {
    expect(normalizeTraitSpeed(35)).toEqual({ set: { walk: 35 } });
  });
});

describe("applyTraitSpeed", () => {
  it("sets walk to 35", () => {
    expect(applyTraitSpeed({ walk: 30 }, [{ speed: { set: { walk: 35 } } }])).toEqual({
      walk: 35
    });
  });

  it("does not lower a higher base walk", () => {
    expect(applyTraitSpeed({ walk: 40 }, [{ speed: { set: { walk: 35 } } }])).toEqual({
      walk: 40
    });
  });

  it("adds 10 to walk", () => {
    expect(applyTraitSpeed({ walk: 30 }, [{ speed: { add: { walk: 10 } } }])).toEqual({
      walk: 40
    });
  });

  it("applies set then add across traits", () => {
    expect(applyTraitSpeed(
      { walk: 30 },
      [{ speed: { set: { walk: 35 } } }, { speed: { add: { walk: 10 } } }]
    )).toEqual({ walk: 45 });
  });

  it("creates fly from set", () => {
    expect(applyTraitSpeed({ walk: 30 }, [{ speed: { set: { fly: 50 } } }])).toEqual({
      walk: 30,
      fly: 50
    });
  });

  it("applies equalToWalk after add", () => {
    expect(applyTraitSpeed(
      { walk: 30 },
      [{ speed: { add: { walk: 10 }, equalToWalk: ["swim"] } }]
    )).toEqual({
      walk: 40,
      swim: 40
    });
  });

  it("normalizes a legacy number speed on a trait", () => {
    expect(applyTraitSpeed({ walk: 30 }, [{ speed: 35 }])).toEqual({
      walk: 35
    });
  });

  it("skips speed from a trait suppressed by equipped armor type ids", () => {
    expect(applyTraitSpeed(
      { walk: 30 },
      [{ speed: { add: { walk: 10 } }, suppressedByArmorTypeIds: ["heavy-type"] }],
      { typeIds: ["heavy-type"] }
    )).toEqual({ walk: 30 });
  });

  it("applies speed when equipped type ids do not match", () => {
    expect(applyTraitSpeed(
      { walk: 30 },
      [{ speed: { add: { walk: 10 } }, suppressedByArmorTypeIds: ["heavy-type"] }],
      { typeIds: ["light-type"] }
    )).toEqual({ walk: 40 });
  });

  it("defaults missing walk to 30", () => {
    expect(applyTraitSpeed(undefined, [])).toEqual({ walk: 30 });
  });
});
