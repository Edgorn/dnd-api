import { describe, expect, it } from "vitest";
import { normalizeCharacterForms } from "./normalizeCharacterForms";

const creatureId = "507f1f77bcf86cd799439011";
const spellId = "507f1f77bcf86cd799439012";

describe("normalizeCharacterForms", () => {
  it("converts legacy string ids", () => {
    expect(normalizeCharacterForms([creatureId])).toEqual([
      { id: creatureId, creatureId }
    ]);
  });

  it("keeps structured forms", () => {
    const form = {
      id: "507f1f77bcf86cd799439013",
      creatureId,
      spellId,
      purpose: "self" as const
    };
    expect(normalizeCharacterForms([form])).toEqual([form]);
  });

  it("keeps target purpose", () => {
    const form = {
      id: "507f1f77bcf86cd799439013",
      creatureId,
      spellId,
      purpose: "target" as const
    };
    expect(normalizeCharacterForms([form])).toEqual([form]);
  });

  it("skips entries without creatureId", () => {
    expect(normalizeCharacterForms([{ id: "x", purpose: "self" }])).toEqual([]);
  });
});
