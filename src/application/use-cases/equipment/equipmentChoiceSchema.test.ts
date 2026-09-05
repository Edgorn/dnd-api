import { describe, it, expect } from "vitest";
import { EquipmentChoiceMongoSchema } from "../../../infrastructure/http/schemas/equipment.schema";

describe("EquipmentChoiceMongoSchema", () => {
  it("accepts flat options choice", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      options: ["507f1f77bcf86cd799439012"]
    });
    expect(result.success).toBe(true);
  });

  it("accepts flat filter choice", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      filter: { subcategory: "canalizador arcano" }
    });
    expect(result.success).toBe(true);
  });

  it("accepts nested alternatives (item vs filter choice)", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      alternatives: [
        { type: "item", id: "507f1f77bcf86cd799439011", quantity: 1 },
        { type: "choice", choose: 1, filter: { subcategory: "canalizador arcano" } }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects mixing alternatives with options", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      options: ["507f1f77bcf86cd799439012"],
      alternatives: [{ type: "item", id: "507f1f77bcf86cd799439011" }]
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty choice without options, filter or alternatives", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({ choose: 1 });
    expect(result.success).toBe(false);
  });
});
