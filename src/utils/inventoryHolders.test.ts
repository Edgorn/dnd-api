import { describe, expect, it } from "vitest";
import { CharacterEquipmentMongo } from "../domain/types/character.types";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";
import {
  applyInventoryHolderState,
  holderHasContents,
  isKnownHolder,
  loadByHolder,
  moveInventoryRows,
  wouldCreateHolderCycle,
} from "./inventoryHolders";

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

function api(
  overrides: Partial<CharacterEquipmentApi> & Pick<CharacterEquipmentApi, "id" | "instanceId">
): CharacterEquipmentApi {
  return {
    ruleset: "sys",
    name: overrides.name ?? overrides.id,
    description: "",
    cost: { quantity: 10, id: "gp", name: "gp", abbreviation: "po", color: "", weight: 0, ruleset: "sys", isBase: true, multiplier: 1 } as CharacterEquipmentApi["cost"],
    weight: 5,
    category: "",
    subcategory: "",
    quantity: 1,
    isProficient: true,
    ...overrides,
  };
}

describe("isKnownHolder", () => {
  const inventory = [
    row({ instanceId: "bag1", equipmentId: "eq-bag" }),
    row({ instanceId: "cart1", equipmentId: "eq-cart" }),
    row({ instanceId: "sword1", equipmentId: "eq-sword" }),
  ];
  const catalog = new Map([
    ["eq-bag", { containerStats: { maxWeight: 30 } }],
    ["eq-cart", { vehicle: { kind: "land" } }],
    ["eq-sword", {}],
  ]);
  const companions = ["comp1"];

  it("accepts the character, a companion, a container and a vehicle", () => {
    expect(isKnownHolder(null, inventory, companions, catalog)).toBe(true);
    expect(isKnownHolder("comp1", inventory, companions, catalog)).toBe(true);
    expect(isKnownHolder("bag1", inventory, companions, catalog)).toBe(true);
    expect(isKnownHolder("cart1", inventory, companions, catalog)).toBe(true);
  });

  it("rejects unknown ids and non-holder inventory rows", () => {
    expect(isKnownHolder("missing", inventory, companions, catalog)).toBe(false);
    expect(isKnownHolder("sword1", inventory, companions, catalog)).toBe(false);
  });
});

describe("wouldCreateHolderCycle", () => {
  it("detects self and descendant holders", () => {
    const inventory = [
      row({ instanceId: "chest", equipmentId: "eq-chest" }),
      row({ instanceId: "bag", equipmentId: "eq-bag", holderId: "chest" }),
      row({ instanceId: "gem", equipmentId: "eq-gem", holderId: "bag" }),
    ];
    expect(wouldCreateHolderCycle(inventory, "chest", "chest")).toBe(true);
    expect(wouldCreateHolderCycle(inventory, "chest", "bag")).toBe(true);
    expect(wouldCreateHolderCycle(inventory, "chest", "gem")).toBe(true);
    expect(wouldCreateHolderCycle(inventory, "gem", "chest")).toBe(false);
    expect(wouldCreateHolderCycle(inventory, "gem", null)).toBe(false);
  });
});

describe("moveInventoryRows", () => {
  it("moves a whole stack onto a companion and unequips it", () => {
    const inventory = [
      row({ instanceId: "saddle", equipmentId: "eq-saddle", equipped: true, quantity: 1 }),
    ];
    const result = moveInventoryRows(inventory, "saddle", "comp1");
    expect(result).toEqual([
      expect.objectContaining({
        instanceId: "saddle",
        holderId: "comp1",
        equipped: false,
      }),
    ]);
  });

  it("splits quantity and stacks onto an existing row on the same holder", () => {
    const inventory = [
      row({ instanceId: "pile", equipmentId: "eq-ration", quantity: 5 }),
      row({ instanceId: "on-horse", equipmentId: "eq-ration", quantity: 2, holderId: "comp1" }),
    ];
    const result = moveInventoryRows(inventory, "pile", "comp1", 3);
    expect(result.find(item => item.instanceId === "pile")?.quantity).toBe(2);
    expect(result.find(item => item.instanceId === "on-horse")?.quantity).toBe(5);
    expect(result).toHaveLength(2);
  });

  it("clears holderId when moving back to the character", () => {
    const inventory = [
      row({ instanceId: "saddle", equipmentId: "eq-saddle", holderId: "comp1" }),
    ];
    const result = moveInventoryRows(inventory, "saddle", null);
    expect(result[0].holderId).toBeUndefined();
  });

  it("throws on cycles", () => {
    const inventory = [
      row({ instanceId: "chest", equipmentId: "eq-chest" }),
      row({ instanceId: "bag", equipmentId: "eq-bag", holderId: "chest" }),
    ];
    expect(() => moveInventoryRows(inventory, "chest", "bag")).toThrow("HOLDER_CYCLE");
  });
});

describe("holderHasContents", () => {
  it("detects nested rows", () => {
    expect(holderHasContents([{ holderId: "chest" }], "chest")).toBe(true);
    expect(holderHasContents([{ holderId: "other" }], "chest")).toBe(false);
  });
});

describe("loadByHolder and applyInventoryHolderState", () => {
  it("sums nested weight and excludes vehicles from character load", () => {
    const equipment = [
      api({ id: "cart", instanceId: "cart1", weight: 200, vehicle: { kind: "land", cargoCapacity: 540 } }),
      api({ id: "crate", instanceId: "crate1", holderId: "cart1", weight: 40 }),
      api({ id: "sword", instanceId: "sword1", weight: 3 }),
      api({ id: "saddle", instanceId: "saddle1", holderId: "horse1", weight: 25 }),
    ];

    expect(loadByHolder(equipment, null, { excludeVehicles: true })).toBe(3);
    expect(loadByHolder(equipment, "cart1")).toBe(40);
    expect(loadByHolder(equipment, "horse1")).toBe(25);

    const state = applyInventoryHolderState(
      equipment,
      [{ id: "horse1", name: "Relámpago", kind: "mount", carryingCapacity: 480 }],
      null
    );
    expect(state.characterLoad).toBe(3);
    expect(state.companions[0].load).toBe(25);
    expect(state.companions[0].capacity).toBe(480);
    expect(state.equipment.find(item => item.instanceId === "cart1")).toMatchObject({
      load: 240,
      capacity: 540,
    });
  });

  it("applies barding multipliers and mount AC when both rules exist", () => {
    const equipment = [
      api({
        id: "barding",
        instanceId: "b1",
        holderId: "horse1",
        equipped: true,
        weight: 20,
        cost: { quantity: 50, id: "gp", name: "gp", abbreviation: "po", color: "", weight: 0, ruleset: "sys", isBase: true, multiplier: 1 } as CharacterEquipmentApi["cost"],
        mountGear: { slot: "barding" },
        armor: { class: { base: 14 } },
      }),
    ];
    const withoutRules = applyInventoryHolderState(
      equipment,
      [{ id: "horse1", name: "Relámpago", kind: "mount", carryingCapacity: 480 }],
      null
    );
    expect(withoutRules.equipment[0].weight).toBe(20);
    expect(withoutRules.companions[0].ac).toBe(14);
    expect(withoutRules.companions[0].load).toBe(20);
    expect(withoutRules.companions[0].warnings).toBeUndefined();

    const withRules = applyInventoryHolderState(
      equipment,
      [{ id: "horse1", name: "Relámpago", kind: "mount", carryingCapacity: 30 }],
      { bardingCostMultiplier: 4, bardingWeightMultiplier: 2 }
    );
    expect(withRules.equipment[0].weight).toBe(40);
    expect(withRules.equipment[0].cost.quantity).toBe(200);
    expect(withRules.companions[0].load).toBe(40);
    expect(withRules.companions[0].warnings).toEqual(["overloaded"]);
  });

  it("does not warn when creature capacity is null", () => {
    const equipment = [
      api({ id: "saddle", instanceId: "s1", holderId: "horse1", weight: 400 }),
    ];
    const state = applyInventoryHolderState(
      equipment,
      [{ id: "horse1", name: "Relámpago", kind: "mount", carryingCapacity: null }],
      null
    );
    expect(state.companions[0].warnings).toBeUndefined();
    expect(state.companions[0].capacity).toBeNull();
  });

  it("computes drawCapacity and draft warnings on vehicles", () => {
    const horse = {
      id: "horse1",
      name: "Relámpago",
      kind: "mount" as const,
      creatureId: "c1",
      carryingCapacity: 480,
      creature: { size: "large" },
    };
    const cart = api({
      id: "cart",
      instanceId: "cart1",
      weight: 200,
      drawnBy: ["horse1"],
      vehicle: {
        kind: "land",
        cargoCapacity: 540,
        armorClass: 15,
        draft: { minAnimals: 2, minSize: "large" },
      },
    });
    const crate = api({ id: "crate", instanceId: "crate1", holderId: "cart1", weight: 40 });

    const withoutRule = applyInventoryHolderState([cart, crate], [horse as never], null);
    expect(withoutRule.equipment[0]).toMatchObject({
      load: 240,
      drawCapacity: null,
      ac: 15,
      warnings: ["insufficientAnimals"],
    });
    expect(withoutRule.equipment[0].warnings).not.toContain("overDrawCapacity");

    const withRule = applyInventoryHolderState(
      [cart, crate],
      [horse as never],
      { drawCapacityMultiplier: 5 }
    );
    expect(withRule.equipment[0].drawCapacity).toBe(2400);

    const overloadedDraw = applyInventoryHolderState(
      [
        api({
          id: "cart",
          instanceId: "cart1",
          weight: 2000,
          drawnBy: ["horse1"],
          vehicle: { kind: "land", cargoCapacity: 540, draft: { minAnimals: 1, minSize: "large" } },
        }),
      ],
      [horse as never],
      { drawCapacityMultiplier: 1 }
    );
    expect(overloadedDraw.equipment[0].warnings).toEqual(["overloaded", "overDrawCapacity"]);
  });

  it("treats unknown or undersized draft animals as insufficient", () => {
    const pony = {
      id: "pony1",
      name: "Poni",
      kind: "mount" as const,
      creatureId: "c2",
      carryingCapacity: 225,
      creature: { size: "medium" },
    };
    const cart = api({
      id: "cart",
      instanceId: "cart1",
      weight: 200,
      drawnBy: ["pony1"],
      vehicle: { kind: "land", draft: { minSize: "large" } },
    });
    const state = applyInventoryHolderState([cart], [pony as never], { drawCapacityMultiplier: 5 });
    expect(state.equipment[0].warnings).toEqual(["insufficientAnimals"]);
    expect(state.equipment[0].drawCapacity).toBe(1125);
  });

  it("does not apply draw warnings to vehicles without draft", () => {
    const boat = api({
      id: "boat",
      instanceId: "boat1",
      weight: 400,
      hpCurrent: 100,
      vehicle: { kind: "water", cargoCapacity: 2000, armorClass: 15, hitPoints: 100 },
    });
    const state = applyInventoryHolderState([boat], [], { drawCapacityMultiplier: 5 });
    expect(state.equipment[0]).toMatchObject({
      load: 400,
      drawCapacity: null,
      ac: 15,
      hpCurrent: 100,
    });
    expect(state.equipment[0].warnings).toBeUndefined();
  });
});
