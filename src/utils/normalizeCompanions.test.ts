import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { MAX_CHARACTER_COMPANIONS, normalizeCompanions } from "./normalizeCompanions";

describe("normalizeCompanions", () => {
  it("returns an empty array for missing or non-array input", () => {
    expect(normalizeCompanions(undefined)).toEqual([]);
    expect(normalizeCompanions(null)).toEqual([]);
  });

  it("generates an ObjectId when id is missing or invalid", () => {
    const [generated] = normalizeCompanions([{ name: "Aldric" }]);
    expect(Types.ObjectId.isValid(generated.id)).toBe(true);
    expect(generated.name).toBe("Aldric");

    const [replaced] = normalizeCompanions([{ id: "not-an-id", name: "Bryn" }]);
    expect(replaced.id).not.toBe("not-an-id");
    expect(Types.ObjectId.isValid(replaced.id)).toBe(true);
  });

  it("keeps a valid ObjectId", () => {
    const id = new Types.ObjectId().toString();
    const [kept] = normalizeCompanions([{ id, name: "Cora" }]);
    expect(kept.id).toBe(id);
  });

  it("trims strings and omits empty optional fields", () => {
    const [companion] = normalizeCompanions([
      {
        name: "  Dara  ",
        role: "  Mayordomo  ",
        notes: "   ",
        sourceTraitId: "",
      },
    ]);

    expect(companion.name).toBe("Dara");
    expect(companion.role).toBe("Mayordomo");
    expect(companion.notes).toBeUndefined();
    expect(companion.sourceTraitId).toBeUndefined();
  });

  it("skips companions without a name after trim", () => {
    expect(normalizeCompanions([{ name: "   " }, { name: "Eda" }])).toEqual([
      expect.objectContaining({ name: "Eda" }),
    ]);
  });

  it(`caps the list at ${MAX_CHARACTER_COMPANIONS} entries`, () => {
    const input = Array.from({ length: MAX_CHARACTER_COMPANIONS + 5 }, (_, i) => ({
      name: `Companion ${i}`,
    }));
    expect(normalizeCompanions(input)).toHaveLength(MAX_CHARACTER_COMPANIONS);
  });
});
