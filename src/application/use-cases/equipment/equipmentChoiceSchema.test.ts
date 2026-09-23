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

  it("accepts nested alternatives with AND bundle (martial+shield vs two martial)", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      alternatives: [
        {
          type: "bundle",
          items: [
            { type: "choice", choose: 1, filter: { "weapon.category": "Martial" } },
            { type: "item", id: "507f1f77bcf86cd799439011", quantity: 1 }
          ]
        },
        { type: "choice", choose: 2, filter: { "weapon.category": "Martial" } }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects bundle with fewer than 2 items", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      alternatives: [
        {
          type: "bundle",
          items: [{ type: "item", id: "507f1f77bcf86cd799439011" }]
        }
      ]
    });
    expect(result.success).toBe(false);
  });

  it("accepts mixed options of catalog ids and partials", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      options: [
        "507f1f77bcf86cd799439012",
        {
          id: "507f1f77bcf86cd799439011",
          materials: ["wood"],
          description: "Oscuras"
        }
      ]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.options).toEqual([
        "507f1f77bcf86cd799439012",
        {
          id: "507f1f77bcf86cd799439011",
          materials: ["wood"],
          description: "Oscuras"
        }
      ]);
    }
  });

  it("rejects an option object without id", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      options: [{ materials: ["wood"] }]
    });
    expect(result.success).toBe(false);
  });

  it("rejects an option object with an unknown material", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      options: [{ id: "507f1f77bcf86cd799439011", materials: ["crystal"] }]
    });
    expect(result.success).toBe(false);
  });

  it("accepts materials on an item leaf together with quantity", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      alternatives: [
        { type: "item", id: "507f1f77bcf86cd799439011", quantity: 1, materials: ["wood"] }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("accepts a partial inside a nested choice", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      alternatives: [
        {
          type: "choice",
          choose: 1,
          options: [{ id: "507f1f77bcf86cd799439011", name: "Ropas oscuras" }]
        }
      ]
    });
    expect(result.success).toBe(true);
  });

  it("rejects nested bundle inside bundle items", () => {
    const result = EquipmentChoiceMongoSchema.safeParse({
      choose: 1,
      alternatives: [
        {
          type: "bundle",
          items: [
            { type: "item", id: "507f1f77bcf86cd799439011" },
            {
              type: "bundle",
              items: [
                { type: "item", id: "507f1f77bcf86cd799439012" },
                { type: "item", id: "507f1f77bcf86cd799439013" }
              ]
            }
          ]
        }
      ]
    });
    expect(result.success).toBe(false);
  });
});
