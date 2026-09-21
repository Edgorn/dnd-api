import { describe, it, expect } from "vitest";
import { UpdateCharacterCompanionsSchema } from "../../../infrastructure/http/schemas/personaje.schema";

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
});
