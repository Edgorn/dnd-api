import { describe, it, expect } from "vitest";
import { LearnSpellsSchema } from "../../../infrastructure/http/schemas/personaje.schema";

describe("LearnSpellsSchema", () => {
  const validId = "507f1f77bcf86cd799439011";

  it("accepts a valid class and non-empty spells array", () => {
    const result = LearnSpellsSchema.safeParse({
      class: validId,
      spells: [validId],
    });
    expect(result.success).toBe(true);
  });

  it("does not require id in the body", () => {
    const result = LearnSpellsSchema.safeParse({
      id: validId,
      class: validId,
      spells: [validId],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("id" in result.data).toBe(false);
    }
  });

  it("rejects invalid ObjectIds in class or spells", () => {
    expect(LearnSpellsSchema.safeParse({
      class: "not-an-id",
      spells: [validId],
    }).success).toBe(false);

    expect(LearnSpellsSchema.safeParse({
      class: validId,
      spells: ["not-an-id"],
    }).success).toBe(false);
  });

  it("rejects an empty spells array", () => {
    const result = LearnSpellsSchema.safeParse({
      class: validId,
      spells: [],
    });
    expect(result.success).toBe(false);
  });
});
