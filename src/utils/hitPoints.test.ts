import { describe, expect, it } from "vitest";
import { applyHpDamage, applyHpHeal } from "./hitPoints";

describe("applyHpDamage", () => {
  it("subtracts amount from current HP", () => {
    expect(applyHpDamage(20, 7)).toBe(13);
  });

  it("floors at 0 when amount exceeds current HP", () => {
    expect(applyHpDamage(5, 12)).toBe(0);
  });

  it("leaves 0 at 0", () => {
    expect(applyHpDamage(0, 1)).toBe(0);
  });
});

describe("applyHpHeal", () => {
  it("adds amount to current HP", () => {
    expect(applyHpHeal(10, 30, 8)).toBe(18);
  });

  it("caps at HPMax", () => {
    expect(applyHpHeal(28, 30, 8)).toBe(30);
  });

  it("does not raise HP when already at max", () => {
    expect(applyHpHeal(30, 30, 5)).toBe(30);
  });
});
