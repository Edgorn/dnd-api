import { describe, expect, it } from "vitest";
import { GetCharacterQuerySchema, GetCharactersQuerySchema, LevelUpDataQuerySchema, MoveCharacterEquipmentSchema, PatchCharacterEquipmentCustomizationSchema, SetVehicleDraftSchema } from "./character.schema";

describe("GetCharactersQuerySchema", () => {
  it("accepts an empty query", () => {
    expect(GetCharactersQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts include=combatSeed", () => {
    const result = GetCharactersQuerySchema.safeParse({ include: "combatSeed" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.include).toBe("combatSeed");
    }
  });

  it("rejects unknown include values", () => {
    const result = GetCharactersQuerySchema.safeParse({ include: "full" });
    expect(result.success).toBe(false);
  });
});

describe("GetCharacterQuerySchema", () => {
  it("accepts an empty query as full sheet", () => {
    expect(GetCharacterQuerySchema.safeParse({}).success).toBe(true);
  });

  it("accepts view=combat and view=sheet", () => {
    expect(GetCharacterQuerySchema.safeParse({ view: "combat" }).success).toBe(true);
    expect(GetCharacterQuerySchema.safeParse({ view: "sheet" }).success).toBe(true);
  });

  it("rejects unknown views", () => {
    expect(GetCharacterQuerySchema.safeParse({ view: "mini" }).success).toBe(false);
  });
});

describe("MoveCharacterEquipmentSchema", () => {
  it("accepts a companion holder and optional quantity", () => {
    const result = MoveCharacterEquipmentSchema.safeParse({
      holderId: "507f1f77bcf86cd799439021",
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it("accepts null holderId to return the item to the character", () => {
    expect(MoveCharacterEquipmentSchema.safeParse({ holderId: null }).success).toBe(true);
  });

  it("rejects a missing holderId", () => {
    expect(MoveCharacterEquipmentSchema.safeParse({ quantity: 1 }).success).toBe(false);
  });
});

describe("SetVehicleDraftSchema", () => {
  it("accepts an empty team and unique companion ids", () => {
    expect(SetVehicleDraftSchema.safeParse({ companionIds: [] }).success).toBe(true);
    expect(SetVehicleDraftSchema.safeParse({
      companionIds: ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439022"],
    }).success).toBe(true);
  });

  it("rejects duplicates and invalid ids", () => {
    expect(SetVehicleDraftSchema.safeParse({
      companionIds: ["507f1f77bcf86cd799439021", "507f1f77bcf86cd799439021"],
    }).success).toBe(false);
    expect(SetVehicleDraftSchema.safeParse({ companionIds: ["nope"] }).success).toBe(false);
    expect(SetVehicleDraftSchema.safeParse({}).success).toBe(false);
  });
});

describe("PatchCharacterEquipmentCustomizationSchema", () => {
  it("rejects an empty body", () => {
    expect(PatchCharacterEquipmentCustomizationSchema.safeParse({}).success).toBe(false);
  });

  it("rejects extra fields", () => {
    expect(PatchCharacterEquipmentCustomizationSchema.safeParse({
      name: "Filo",
      weight: 1,
    }).success).toBe(false);
  });

  it("accepts name null to revert to catalog", () => {
    const result = PatchCharacterEquipmentCustomizationSchema.safeParse({ name: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBeNull();
    }
  });

  it("accepts a description array", () => {
    const result = PatchCharacterEquipmentCustomizationSchema.safeParse({
      description: ["Runas heladas", "Botín del templo"],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty name string", () => {
    expect(PatchCharacterEquipmentCustomizationSchema.safeParse({ name: "" }).success).toBe(false);
  });
});

describe("LevelUpDataQuerySchema", () => {
  it("requires class and accepts optional compact view", () => {
    expect(LevelUpDataQuerySchema.safeParse({}).success).toBe(false);
    expect(LevelUpDataQuerySchema.safeParse({ class: "cls" }).success).toBe(true);
    expect(LevelUpDataQuerySchema.safeParse({ class: "cls", view: "compact" }).success).toBe(true);
    expect(LevelUpDataQuerySchema.safeParse({ class: "cls", view: "sheet" }).success).toBe(false);
  });
});
