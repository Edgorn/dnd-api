import { describe, expect, it } from "vitest";
import CharacterModel from "./Character";

describe("Character schema indexes", () => {
  it("indexes user for list lookups", () => {
    const indexes = CharacterModel.schema.indexes();
    expect(indexes.some(([fields]) => fields.user === 1)).toBe(true);
  });
});
