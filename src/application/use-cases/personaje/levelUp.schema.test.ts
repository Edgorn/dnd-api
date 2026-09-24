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

  it("accepts an optional subclass ObjectId", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      subclass: validId,
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid subclass id", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      subclass: "evocation",
    });
    expect(result.success).toBe(false);
  });

  it("accepts a +2 abilityScore increase", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      abilityScore: { increases: [{ key: "str", bonus: 2 }] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts two +1 abilityScore increases", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      abilityScore: { increases: [{ key: "str", bonus: 1 }, { key: "dex", bonus: 1 }] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts an optional feat ObjectId", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      feat: validId,
    });
    expect(result.success).toBe(true);
  });

  it("rejects sending abilityScore and feat together", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      abilityScore: { increases: [{ key: "str", bonus: 2 }] },
      feat: validId,
    });
    expect(result.success).toBe(false);
  });

  it("rejects abilityScore increases that do not sum to 2", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      abilityScore: { increases: [{ key: "str", bonus: 1 }] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate abilityScore keys", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      abilityScore: { increases: [{ key: "str", bonus: 1 }, { key: "str", bonus: 1 }] },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a bonus other than 1 or 2", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      abilityScore: { increases: [{ key: "str", bonus: 3 }] },
    });
    expect(result.success).toBe(false);
  });

  it("accepts trait damage choices", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      traitChoices: {
        "draconic-ancestry": { ancestor: ["red"] },
      },
    });
    expect(result.success).toBe(true);
  });

  it("accepts a catalog option with free text and a null language", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      traitChoices: {
        "enemigo-predilecto": {
          favoredEnemy: [{ name: "Humanoides", inputs: ["Orcos", "Trasgos"], languageId: null }],
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid feat id", () => {
    const result = LevelUpSchema.safeParse({
      class: "class1",
      hpIncrease: 5,
      feat: "alert",
    });
    expect(result.success).toBe(false);
  });
});
