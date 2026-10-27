import { describe, it, expect } from "vitest";
import { CreateEquipmentSchema, GetEquipmentsQuerySchema, UpdateEquipmentSchema } from "../../../infrastructure/http/schemas/equipment.schema";

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

describe("CreateEquipmentSchema mountGear and vehicle", () => {
  it("accepts a saddle", () => {
    const result = CreateEquipmentSchema.safeParse({
      ...createBase,
      mountGear: { slot: "saddle" }
    });
    expect(result.success).toBe(true);
  });

  it("rejects saddleType on mountGear", () => {
    expect(CreateEquipmentSchema.safeParse({
      ...createBase,
      mountGear: { slot: "saddle", saddleType: "riding" }
    }).success).toBe(false);
  });

  it("accepts a land vehicle with travel speed in mph", () => {
    const result = CreateEquipmentSchema.safeParse({
      ...createBase,
      name: "Wagon",
      vehicle: {
        kind: "land",
        travelSpeed: { value: 2, unit: "mph" },
        cargoCapacity: 400,
        draft: { minAnimals: 2, minSize: "Grande" }
      }
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.vehicle?.draft?.minSize).toBe("large");
    }
  });

  it("rejects an unknown mount gear slot", () => {
    expect(CreateEquipmentSchema.safeParse({
      ...createBase,
      mountGear: { slot: "stirrups" }
    }).success).toBe(false);
  });
});

describe("GetEquipmentsQuerySchema", () => {
  it("accepts vehicle and mount gear filters", () => {
    expect(GetEquipmentsQuerySchema.safeParse({ hasVehicle: "true", mountGearSlot: "barding" }).success).toBe(true);
  });

  it("rejects an unknown mount gear slot filter", () => {
    expect(GetEquipmentsQuerySchema.safeParse({ mountGearSlot: "stirrups" }).success).toBe(false);
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
