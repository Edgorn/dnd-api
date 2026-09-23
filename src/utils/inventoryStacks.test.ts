import { describe, expect, it } from "vitest";
import {
  addToInventory,
  canStackWith,
  cloneInventory,
  createInventoryInstance,
  removeOrDecrement,
  splitOne,
  tryMerge,
} from "./inventoryStacks";
import { PersonajeEquipmentMongo } from "../domain/types/personajes.types";

function row(
  overrides: Partial<PersonajeEquipmentMongo> & Pick<PersonajeEquipmentMongo, "instanceId" | "equipmentId">
): PersonajeEquipmentMongo {
  return {
    quantity: 1,
    equipped: false,
    isMagic: false,
    isBond: false,
    isFavorite: false,
    ...overrides,
  };
}

describe("canStackWith", () => {
  it("stacks matching catalog id and magic flag when all other flags are false", () => {
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", quantity: 2 }),
      row({ instanceId: "b", equipmentId: "eq1", quantity: 1 })
    )).toBe(true);
  });

  it("does not stack bonded items", () => {
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", isBond: true }),
      row({ instanceId: "b", equipmentId: "eq1" })
    )).toBe(false);
  });

  it("does not stack equipped or favorite items", () => {
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", equipped: true }),
      row({ instanceId: "b", equipmentId: "eq1" })
    )).toBe(false);
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", isFavorite: true }),
      row({ instanceId: "b", equipmentId: "eq1" })
    )).toBe(false);
  });

  it("does not stack mundane with magic copies", () => {
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", isMagic: true }),
      row({ instanceId: "b", equipmentId: "eq1", isMagic: false })
    )).toBe(false);
  });

  it("does not stack rows with different customization", () => {
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", customization: { materials: ["wood"] } }),
      row({ instanceId: "b", equipmentId: "eq1", customization: { materials: ["metal"] } })
    )).toBe(false);
  });

  it("stacks rows with the same customization", () => {
    expect(canStackWith(
      row({ instanceId: "a", equipmentId: "eq1", customization: { materials: ["wood"] } }),
      row({ instanceId: "b", equipmentId: "eq1", customization: { materials: ["wood"] } })
    )).toBe(true);
  });
});

describe("cloneInventory", () => {
  it("preserves customization on each row", () => {
    const inventory = [
      row({
        instanceId: "a",
        equipmentId: "eq1",
        customization: { materials: ["wood"], description: "Escudo de madera" },
      }),
    ];
    const cloned = cloneInventory(inventory);
    expect(cloned[0].customization).toEqual({
      materials: ["wood"],
      description: "Escudo de madera",
    });
  });
});

describe("addToInventory", () => {
  it("increments a compatible stack", () => {
    const existing = row({ instanceId: "a", equipmentId: "eq1", quantity: 2 });
    const added = createInventoryInstance({ equipmentId: "eq1", quantity: 3, isMagic: false });
    const result = addToInventory([existing], added);

    expect(result).toHaveLength(1);
    expect(result[0].instanceId).toBe("a");
    expect(result[0].quantity).toBe(5);
  });

  it("creates a new instance when there is no compatible stack", () => {
    const existing = row({ instanceId: "a", equipmentId: "eq1", isMagic: true });
    const added = createInventoryInstance({ equipmentId: "eq1", quantity: 1, isMagic: false });
    const result = addToInventory([existing], added);

    expect(result).toHaveLength(2);
    expect(result[1].equipmentId).toBe("eq1");
    expect(result[1].isMagic).toBe(false);
    expect(result[1].instanceId).toMatch(/^[0-9a-f]{24}$/i);
  });

  it("never stacks a bonded incoming row", () => {
    const existing = row({ instanceId: "a", equipmentId: "eq1" });
    const bonded = createInventoryInstance({
      equipmentId: "eq1",
      quantity: 1,
      isMagic: true,
      isBond: true,
    });
    const result = addToInventory([existing], bonded);

    expect(result).toHaveLength(2);
    expect(result[1].isBond).toBe(true);
    expect(result[1].quantity).toBe(1);
  });
});

describe("splitOne", () => {
  it("returns the same instance when quantity is 1", () => {
    const item = row({ instanceId: "a", equipmentId: "eq1" });
    const result = splitOne([item], "a");

    expect(result.inventory).toHaveLength(1);
    expect(result.instance.instanceId).toBe("a");
    expect(result.instance.quantity).toBe(1);
  });

  it("leaves the remainder and returns a new unit instance", () => {
    const item = row({ instanceId: "a", equipmentId: "eq1", quantity: 4, isMagic: true });
    const result = splitOne([item], "a");

    expect(result.inventory).toHaveLength(2);
    expect(result.inventory[0]).toMatchObject({
      instanceId: "a",
      quantity: 3,
      isMagic: true,
      equipped: false,
      isFavorite: false,
      isBond: false,
    });
    expect(result.instance.quantity).toBe(1);
    expect(result.instance.instanceId).not.toBe("a");
    expect(result.instance.equipmentId).toBe("eq1");
    expect(result.instance.isMagic).toBe(true);
  });
});

describe("tryMerge", () => {
  it("merges an unbound unit into a compatible stack", () => {
    const stack = row({ instanceId: "a", equipmentId: "eq1", quantity: 3 });
    const unit = row({ instanceId: "b", equipmentId: "eq1", quantity: 1 });
    const result = tryMerge([stack, unit], "b");

    expect(result).toHaveLength(1);
    expect(result[0].instanceId).toBe("a");
    expect(result[0].quantity).toBe(4);
  });

  it("does not merge bonded, equipped or favorite rows", () => {
    const stack = row({ instanceId: "a", equipmentId: "eq1", quantity: 2 });
    const bonded = row({ instanceId: "b", equipmentId: "eq1", isBond: true });
    expect(tryMerge([stack, bonded], "b")).toHaveLength(2);
  });
});

describe("removeOrDecrement", () => {
  it("decrements when quantity is less than the stack", () => {
    const item = row({ instanceId: "a", equipmentId: "eq1", quantity: 5 });
    const result = removeOrDecrement([item], "a", 2);
    expect(result).toEqual([expect.objectContaining({ instanceId: "a", quantity: 3 })]);
  });

  it("removes the row when quantity is omitted or not smaller than the stack", () => {
    const item = row({ instanceId: "a", equipmentId: "eq1", quantity: 2 });
    expect(removeOrDecrement([item], "a")).toEqual([]);
    expect(removeOrDecrement([item], "a", 2)).toEqual([]);
    expect(removeOrDecrement([item], "a", 9)).toEqual([]);
  });
});
