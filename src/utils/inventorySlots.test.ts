import { describe, expect, it } from "vitest";
import { EquipSlot } from "../domain/types/equipment.types";
import { CharacterEquipmentMongo } from "../domain/types/character.types";
import { applyEquip, applyMountGear, occupiedSlotsFor, slotCapacity } from "./inventorySlots";

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

function slots(map: Record<string, EquipSlot | null>): (item: CharacterEquipmentMongo) => EquipSlot | null {
  return item => map[item.instanceId] ?? null;
}

describe("slotCapacity", () => {
  it("allows two rings and one of every other slot", () => {
    expect(slotCapacity("ring")).toBe(2);
    expect(slotCapacity("armor")).toBe(1);
    expect(slotCapacity("main_hand")).toBe(1);
  });
});

describe("occupiedSlotsFor", () => {
  it("makes two_handed occupy both hands", () => {
    expect(occupiedSlotsFor("two_handed")).toEqual(["main_hand", "off_hand"]);
    expect(occupiedSlotsFor("main_hand")).toEqual(["main_hand"]);
  });
});

describe("applyEquip", () => {
  it("throws when the item has no equipSlot", () => {
    const potion = row({ instanceId: "p1", equipmentId: "potion" });
    expect(() => applyEquip([potion], "p1", true, () => null)).toThrow("NO_EQUIP_SLOT");
  });

  it("keeps two rings equipped and unequips the oldest when a third is equipped", () => {
    const first = row({ instanceId: "r1", equipmentId: "ring", equipped: true });
    const second = row({ instanceId: "r2", equipmentId: "ring", equipped: true });
    const third = row({ instanceId: "r3", equipmentId: "ring" });
    const slotOf = slots({ r1: "ring", r2: "ring", r3: "ring" });

    const result = applyEquip([first, second, third], "r3", true, slotOf);

    expect(result.find(item => item.instanceId === "r1")?.equipped).toBe(false);
    expect(result.find(item => item.instanceId === "r2")?.equipped).toBe(true);
    expect(result.find(item => item.instanceId === "r3")?.equipped).toBe(true);
  });

  it("unequips weapon and shield when equipping a two-handed weapon", () => {
    const sword = row({ instanceId: "s1", equipmentId: "sword", equipped: true });
    const shield = row({ instanceId: "sh1", equipmentId: "shield", equipped: true });
    const greataxe = row({ instanceId: "g1", equipmentId: "greataxe" });
    const slotOf = slots({ s1: "main_hand", sh1: "off_hand", g1: "two_handed" });

    const result = applyEquip([sword, shield, greataxe], "g1", true, slotOf);

    expect(result.find(item => item.instanceId === "s1")?.equipped).toBe(false);
    expect(result.find(item => item.instanceId === "sh1")?.equipped).toBe(false);
    expect(result.find(item => item.instanceId === "g1")?.equipped).toBe(true);
  });

  it("unequips a two-handed weapon when equipping a main-hand or off-hand item", () => {
    const greataxe = row({ instanceId: "g1", equipmentId: "greataxe", equipped: true });
    const sword = row({ instanceId: "s1", equipmentId: "sword" });
    const shield = row({ instanceId: "sh1", equipmentId: "shield" });
    const slotOf = slots({ g1: "two_handed", s1: "main_hand", sh1: "off_hand" });

    const afterSword = applyEquip([greataxe, sword, shield], "s1", true, slotOf);
    expect(afterSword.find(item => item.instanceId === "g1")?.equipped).toBe(false);
    expect(afterSword.find(item => item.instanceId === "s1")?.equipped).toBe(true);

    const greataxeAgain = row({ instanceId: "g1", equipmentId: "greataxe", equipped: true });
    const afterShield = applyEquip([greataxeAgain, sword, shield], "sh1", true, slotOf);
    expect(afterShield.find(item => item.instanceId === "g1")?.equipped).toBe(false);
    expect(afterShield.find(item => item.instanceId === "sh1")?.equipped).toBe(true);
  });

  it("unequips without touching other slots", () => {
    const helmet = row({ instanceId: "h1", equipmentId: "helm", equipped: true });
    const slotOf = slots({ h1: "head" });
    const result = applyEquip([helmet], "h1", false, slotOf);
    expect(result[0].equipped).toBe(false);
  });

  it("does not unequip armor worn by a mount when the character equips armor", () => {
    const barding = row({ instanceId: "b1", equipmentId: "barding", equipped: true, holderId: "horse" });
    const mail = row({ instanceId: "m1", equipmentId: "mail" });
    const slotOf = slots({ b1: "armor", m1: "armor" });
    const result = applyEquip([barding, mail], "m1", true, slotOf);
    expect(result.find(item => item.instanceId === "b1")?.equipped).toBe(true);
    expect(result.find(item => item.instanceId === "m1")?.equipped).toBe(true);
  });
});

describe("applyMountGear", () => {
  it("keeps one item per mount slot on the same holder", () => {
    const oldSaddle = row({ instanceId: "s1", equipmentId: "saddle-a", equipped: true, holderId: "horse" });
    const newSaddle = row({ instanceId: "s2", equipmentId: "saddle-b", holderId: "horse" });
    const otherHorse = row({ instanceId: "s3", equipmentId: "saddle-c", equipped: true, holderId: "mule" });
    const slotOf = () => "saddle" as const;

    const result = applyMountGear([oldSaddle, newSaddle, otherHorse], "s2", true, slotOf);
    expect(result.find(item => item.instanceId === "s1")?.equipped).toBe(false);
    expect(result.find(item => item.instanceId === "s2")?.equipped).toBe(true);
    expect(result.find(item => item.instanceId === "s3")?.equipped).toBe(true);
  });
});
