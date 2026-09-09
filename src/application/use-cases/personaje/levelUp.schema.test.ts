import { describe, it, expect } from "vitest";
import { LevelUpSchema } from "../../../infrastructure/http/schemas/personaje.schema";

describe("LevelUpSchema", () => {
  const validId = "507f1f77bcf86cd799439011";

  it("accepts the body without spells", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
    });
    expect(result.success).toBe(true);
  });

  it("accepts spells as an array of ObjectId arrays", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      spells: [[validId], [validId]],
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid ObjectIds in spells", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      spells: [["not-an-id"]],
    });
    expect(result.success).toBe(false);
  });

  it("rejects a flat spells array", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      spells: [validId],
    });
    expect(result.success).toBe(false);
  });
});
