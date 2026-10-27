import { describe, expect, it } from "vitest";
import { CharacterEquipmentMongo } from "../domain/types/character.types";
import {
  isCompanionHitched,
  isDraftableCompanion,
  setVehicleDrawnBy,
  uniqueCompanionIds,
} from "./vehicleDraft";

function row(
  overrides: Partial<CharacterEquipmentMongo> & Pick<CharacterEquipmentMongo, "instanceId" | "equipmentId">
): CharacterEquipmentMongo {
  return {
    quantity: 1,
    equipped: false,
    isMagic: false,
    isBond: false,
    isFavorite: false,
    ...overrides,
  };
}

describe("uniqueCompanionIds", () => {
  it("keeps first occurrence order", () => {
    expect(uniqueCompanionIds(["a", "b", "a", "c"])).toEqual(["a", "b", "c"]);
  });
});

describe("isCompanionHitched", () => {
  const inventory = [
    row({ instanceId: "cart1", equipmentId: "eq-cart", drawnBy: ["horse1"] }),
    row({ instanceId: "cart2", equipmentId: "eq-cart", drawnBy: ["mule1"] }),
  ];

  it("detects a companion on any vehicle except the excluded instance", () => {
    expect(isCompanionHitched(inventory, "horse1")).toBe(true);
    expect(isCompanionHitched(inventory, "horse1", "cart1")).toBe(false);
    expect(isCompanionHitched(inventory, "mule1", "cart1")).toBe(true);
    expect(isCompanionHitched(inventory, "missing")).toBe(false);
  });
});

describe("isDraftableCompanion", () => {
  it("requires mount or animal with a creature", () => {
    expect(isDraftableCompanion({ id: "1", name: "A", kind: "mount", creatureId: "c1" })).toBe(true);
    expect(isDraftableCompanion({ id: "1", name: "A", kind: "animal", creatureId: "c1" })).toBe(true);
    expect(isDraftableCompanion({ id: "1", name: "A", kind: "mount" })).toBe(false);
    expect(isDraftableCompanion({ id: "1", name: "A", kind: "hireling", creatureId: "c1" })).toBe(false);
  });
});

describe("setVehicleDrawnBy", () => {
  it("replaces drawnBy on the target instance", () => {
    const inventory = [
      row({ instanceId: "cart1", equipmentId: "eq-cart", drawnBy: ["old"] }),
    ];
    const result = setVehicleDrawnBy(inventory, "cart1", ["horse1", "horse1", "mule1"]);
    expect(result[0].drawnBy).toEqual(["horse1", "mule1"]);
    expect(inventory[0].drawnBy).toEqual(["old"]);
  });

  it("throws when the instance is missing", () => {
    expect(() => setVehicleDrawnBy([], "cart1", [])).toThrow("INVENTORY_INSTANCE_NOT_FOUND");
  });
});
