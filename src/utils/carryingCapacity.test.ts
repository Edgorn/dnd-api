import { describe, expect, it } from "vitest";
import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { characterCarryingCapacity, drawCapacity } from "./carryingCapacity";

function str(value: number): CharacterAttributeApi[] {
  return [{ id: "str", key: "str", name: "Fuerza", value }];
}

describe("characterCarryingCapacity", () => {
  it("returns null when the system has no formula", () => {
    expect(characterCarryingCapacity(str(16))).toBeNull();
    expect(characterCarryingCapacity(str(16), null)).toBeNull();
  });

  it("evaluates the system formula", () => {
    expect(characterCarryingCapacity(str(16), "@attributes.str.value * 15")).toBe(240);
  });
});

describe("drawCapacity", () => {
  it("returns null without a draw multiplier", () => {
    expect(drawCapacity([240, 420])).toBeNull();
  });

  it("uses drawCapacityMultiplier from the system when set", () => {
    expect(drawCapacity([100], { drawCapacityMultiplier: 4 })).toBe(400);
  });
});
