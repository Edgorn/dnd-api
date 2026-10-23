import { describe, expect, it } from "vitest";
import {
  applyGrantUniqueEquipment,
  applyReplaceUniqueEquipment,
  clearUniqueGrantedOnTraitLost,
  hasUniqueGranted,
  hydrateUniqueEquipmentGrant,
  ownedUniqueEquipmentGrant
} from "./uniqueEquipmentGrant";
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
    ...overrides
  };
}

const book = row({ instanceId: "tome-1", equipmentId: "book", uniqueGranted: true });
const pack = row({ instanceId: "pack", equipmentId: "pack" });

describe("hydrateUniqueEquipmentGrant", () => {
  const bookId = "507f1f77bcf86cd799439011";

  it("returns id and catalog name", () => {
    expect(hydrateUniqueEquipmentGrant(
      { equipmentId: bookId },
      new Map([[bookId, { id: bookId, name: "Libro de las Sombras" }]])
    )).toEqual({ id: bookId, name: "Libro de las Sombras" });
  });

  it("omits the grant when the catalog entry is missing", () => {
    expect(hydrateUniqueEquipmentGrant(
      { equipmentId: bookId },
      new Map()
    )).toBeUndefined();
  });
});

describe("ownedUniqueEquipmentGrant", () => {
  it("returns the first uniqueEquipmentGrant catalog id", () => {
    const grant = { id: "507f1f77bcf86cd799439011", name: "Libro de las Sombras" };
    expect(ownedUniqueEquipmentGrant([{ uniqueEquipmentGrant: grant }])).toBe(grant.id);
    expect(ownedUniqueEquipmentGrant([{}])).toBeUndefined();
  });
});

describe("hasUniqueGranted", () => {
  it("detects a uniquely granted instance", () => {
    expect(hasUniqueGranted([pack, book])).toBe(true);
    expect(hasUniqueGranted([pack])).toBe(false);
  });
});

describe("applyGrantUniqueEquipment", () => {
  it("adds the item when none exists", () => {
    const next = row({ instanceId: "new", equipmentId: "book", uniqueGranted: true });
    const result = applyGrantUniqueEquipment([pack], next);
    expect(result).toHaveLength(2);
    expect(result[1].instanceId).toBe("new");
    expect(result[1].uniqueGranted).toBe(true);
  });

  it("does not duplicate an existing granted item", () => {
    const next = row({ instanceId: "new", equipmentId: "book", uniqueGranted: true });
    const result = applyGrantUniqueEquipment([book, pack], next);
    expect(result.map(item => item.instanceId)).toEqual(["tome-1", "pack"]);
  });
});

describe("applyReplaceUniqueEquipment", () => {
  it("destroys previous granted items and adds the replacement", () => {
    const next = row({ instanceId: "new", equipmentId: "book", uniqueGranted: true });
    const result = applyReplaceUniqueEquipment([book, pack], next);
    expect(result.map(item => item.instanceId)).toEqual(["pack", "new"]);
    expect(result.find(item => item.instanceId === "new")?.uniqueGranted).toBe(true);
  });
});

describe("clearUniqueGrantedOnTraitLost", () => {
  it("removes uniquely granted rows and keeps the rest", () => {
    expect(clearUniqueGrantedOnTraitLost([book, pack]).map(item => item.instanceId)).toEqual(["pack"]);
  });
});
