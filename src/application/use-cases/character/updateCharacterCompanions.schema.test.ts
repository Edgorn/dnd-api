import { describe, it, expect } from "vitest";
import {
  AddCompanionSchema,
  UpdateCharacterCompanionsSchema,
  UpdateCompanionSchema,
} from "../../../infrastructure/http/schemas/character.schema";

describe("UpdateCharacterCompanionsSchema", () => {
  it("accepts an empty roster", () => {
    const result = UpdateCharacterCompanionsSchema.safeParse({ companions: [] });
    expect(result.success).toBe(true);
  });

  it("accepts companions with optional fields", () => {
    const result = UpdateCharacterCompanionsSchema.safeParse({
      companions: [
        {
          name: "Aldric",
          role: "Mayordomo",
          notes: "Leal",
          sourceTraitId: "507f1f77bcf86cd799439011",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects a companion without name", () => {
    const result = UpdateCharacterCompanionsSchema.safeParse({
      companions: [{ role: "Mensajero" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects more than 20 companions", () => {
    const result = UpdateCharacterCompanionsSchema.safeParse({
      companions: Array.from({ length: 21 }, (_, i) => ({ name: `C${i}` })),
    });
    expect(result.success).toBe(false);
  });

  it("accepts mount fields", () => {
    const result = UpdateCharacterCompanionsSchema.safeParse({
      companions: [{
        name: "Relámpago",
        kind: "mount",
        creatureId: "507f1f77bcf86cd799439011",
        source: "purchase",
        hpCurrent: 19,
      }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown kind", () => {
    const result = UpdateCharacterCompanionsSchema.safeParse({
      companions: [{ name: "X", kind: "pet" }],
    });
    expect(result.success).toBe(false);
  });
});

describe("AddCompanionSchema", () => {
  it("accepts a mount purchase", () => {
    const result = AddCompanionSchema.safeParse({
      name: "Relámpago",
      kind: "mount",
      creatureId: "507f1f77bcf86cd799439011",
      source: "purchase",
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdateCompanionSchema", () => {
  it("requires at least one field", () => {
    expect(UpdateCompanionSchema.safeParse({}).success).toBe(false);
    expect(UpdateCompanionSchema.safeParse({ hpCurrent: 10 }).success).toBe(true);
  });
});
