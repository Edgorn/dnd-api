import { describe, it, expect } from "vitest";
import { GrantedEquipmentEntrySchema, GrantedEquipmentListSchema } from "../../../infrastructure/http/schemas/equipment.schema";

const catalogId = "507f1f77bcf86cd799439011";

describe("GrantedEquipmentEntrySchema", () => {
  it("accepts a catalog id string", () => {
    const result = GrantedEquipmentEntrySchema.safeParse(catalogId);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ id: catalogId, quantity: 1 });
    }
  });

  it("accepts a partial object with id and materials", () => {
    const result = GrantedEquipmentEntrySchema.safeParse({
      id: catalogId,
      materials: ["wood"],
      description: "Escudo de madera",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.materials).toEqual(["wood"]);
    }
  });

  it("rejects an object without id", () => {
    const result = GrantedEquipmentEntrySchema.safeParse({
      name: "Solo nombre",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown material", () => {
    const result = GrantedEquipmentEntrySchema.safeParse({
      id: catalogId,
      materials: ["adamantine"],
    });
    expect(result.success).toBe(false);
  });
});

describe("GrantedEquipmentListSchema", () => {
  it("accepts a mixed list of strings and partial objects", () => {
    const result = GrantedEquipmentListSchema.safeParse([
      catalogId,
      { id: "507f1f77bcf86cd799439012", name: "Ropas oscuras" },
    ]);
    expect(result.success).toBe(true);
  });
});
