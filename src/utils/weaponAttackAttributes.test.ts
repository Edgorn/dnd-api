import { describe, it, expect } from "vitest";
import {
  isRangedWeapon,
  resolveWeaponAttackAttributes,
  resolveWeaponAttributeStats,
  weaponHasTwoHandedProperty,
} from "./weaponAttackAttributes";
import { Property } from "../domain/types/property.types";
import { WeaponApi } from "../domain/types/equipment.types";

const sampleAttributes = [
  { key: "str", name: "Fuerza", value: 16, modifier: 3 },
  { key: "dex", name: "Destreza", value: 14, modifier: 2 },
];

describe("weaponAttackAttributes", () => {
  it("detects ranged weapons by normalized range label", () => {
    expect(isRangedWeapon({ range: "Distancia" })).toBe(true);
    expect(isRangedWeapon({ range: "A distancia" })).toBe(true);
    expect(isRangedWeapon({ range: "Cuerpo a cuerpo" })).toBe(false);
  });

  it("resolves melee base attributes", () => {
    const weapon: Pick<WeaponApi, "range" | "properties"> = {
      range: "Cuerpo a cuerpo",
      properties: [],
    };

    const keys = resolveWeaponAttackAttributes(weapon, {
      meleeAttackAttributes: ["str"],
      rangedAttackAttributes: ["dex"],
    });

    expect(keys).toEqual(["str"]);
  });

  it("resolves ranged base attributes", () => {
    const weapon: Pick<WeaponApi, "range" | "properties"> = {
      range: "Distancia",
      properties: [],
    };

    const keys = resolveWeaponAttackAttributes(weapon, {
      meleeAttackAttributes: ["str"],
      rangedAttackAttributes: ["dex"],
    });

    expect(keys).toEqual(["dex"]);
  });

  it("merges property attackAttributes with base attributes", () => {
    const finesseProperty: Property = {
      id: "prop1",
      name: "Sutil",
      description: "",
      ruleset: "dnd5e",
      attackAttributes: ["dex"],
    };

    const weapon: Pick<WeaponApi, "range" | "properties"> = {
      range: "Cuerpo a cuerpo",
      properties: [finesseProperty],
    };

    const keys = resolveWeaponAttackAttributes(weapon, {
      meleeAttackAttributes: ["str"],
      rangedAttackAttributes: ["dex"],
    });

    expect(keys).toEqual(["str", "dex"]);
  });

  it("falls back to dex for legacy finesse property names without attackAttributes", () => {
    const legacyFinesse: Property = {
      id: "prop2",
      name: "Sutileza",
      description: "",
      ruleset: "dnd5e",
    };

    const weapon: Pick<WeaponApi, "range" | "properties"> = {
      range: "Cuerpo a cuerpo",
      properties: [legacyFinesse],
    };

    const keys = resolveWeaponAttackAttributes(weapon, {});
    expect(keys).toEqual(["str", "dex"]);
  });

  it("returns max modifier among resolved attributes", () => {
    const weapon: Pick<WeaponApi, "range" | "properties"> = {
      range: "Cuerpo a cuerpo",
      properties: [{ id: "p1", name: "Sutil", description: "", ruleset: "dnd5e", attackAttributes: ["dex"] }],
    };

    const stats = resolveWeaponAttributeStats(
      weapon,
      { meleeAttackAttributes: ["str"], rangedAttackAttributes: ["dex"] },
      sampleAttributes as any
    );

    expect(stats.attributeModifier).toBe(3);
    expect(stats.attributeValue).toBe(16);
  });

  it("detects two-handed property names", () => {
    expect(
      weaponHasTwoHandedProperty({
        properties: [{ id: "p1", name: "A dos manos", description: "", ruleset: "dnd5e" }],
      })
    ).toBe(true);
  });
});
