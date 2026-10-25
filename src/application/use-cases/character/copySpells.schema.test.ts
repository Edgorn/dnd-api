import { describe, it, expect } from "vitest";
import { CopySpellsSchema } from "../../../infrastructure/http/schemas/character.schema";

describe("CopySpellsSchema", () => {
  const validId = "507f1f77bcf86cd799439011";

  it("accepts a valid class and non-empty spells array", () => {
    const result = CopySpellsSchema.safeParse({
      class: validId,
      spells: [validId],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional traitId", () => {
    const result = CopySpellsSchema.safeParse({
      class: validId,
      spells: [validId],
      traitId: validId,
    });
    expect(result.success).toBe(true);
  });

  it("does not require id in the body", () => {
    const result = CopySpellsSchema.safeParse({
      id: validId,
      class: validId,
      spells: [validId],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("id" in result.data).toBe(false);
    }
  });

  it("rejects invalid ObjectIds", () => {
    expect(CopySpellsSchema.safeParse({
      class: "not-an-id",
      spells: [validId],
    }).success).toBe(false);

    expect(CopySpellsSchema.safeParse({
      class: validId,
      spells: ["not-an-id"],
    }).success).toBe(false);
  });

  it("rejects an empty spells array", () => {
    const result = CopySpellsSchema.safeParse({
      class: validId,
      spells: [],
    });
    expect(result.success).toBe(false);
  });
});
