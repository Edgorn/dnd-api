import { describe, it, expect } from "vitest";
import { CreateEquipmentSchema, UpdateEquipmentSchema } from "../../../infrastructure/http/schemas/equipment.schema";

const coinId = "507f1f77bcf86cd799439011";

const createBase = {
  ruleset: "sys1",
  name: "Coraza",
  description: "Armadura de placas",
  cost: { quantity: 1500, unit: coinId },
  weight: 65,
  category: "Armor",
  subcategory: "Heavy",
};

describe("CreateEquipmentSchema materials", () => {
  it("accepts a known material", () => {
    const result = CreateEquipmentSchema.safeParse({
      ...createBase,
      materials: ["metal"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown material", () => {
    const result = CreateEquipmentSchema.safeParse({
      ...createBase,
      materials: ["adamantine"],
    });
    expect(result.success).toBe(false);
  });
});

describe("UpdateEquipmentSchema materials", () => {
  it("accepts null to clear materials", () => {
    const result = UpdateEquipmentSchema.safeParse({ materials: null });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown material", () => {
    const result = UpdateEquipmentSchema.safeParse({ materials: ["iron"] });
    expect(result.success).toBe(false);
  });
});
