import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import {
  MAX_CHARACTER_COMPANIONS,
  companionRemovalConflict,
  mergeCompanionsOnReplace,
  normalizeCompanions,
} from "./normalizeCompanions";

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

  it("defaults kind to narrative and keeps mount catalog fields", () => {
    const creatureId = new Types.ObjectId().toString();
    const [companion] = normalizeCompanions([
      {
        name: "Relámpago",
        kind: "mount",
        creatureId,
        source: "purchase",
        hpCurrent: 19,
        conditions: [new Types.ObjectId().toString()],
      },
    ]);

    expect(companion.kind).toBe("mount");
    expect(companion.creatureId).toBe(creatureId);
    expect(companion.source).toBe("purchase");
    expect(companion.hpCurrent).toBe(19);
    expect(companion.conditions).toHaveLength(1);
  });
});

describe("mergeCompanionsOnReplace", () => {
  it("preserves creatureId, hpCurrent and conditions of existing ids", () => {
    const id = new Types.ObjectId().toString();
    const creatureId = new Types.ObjectId().toString();
    const conditionId = new Types.ObjectId().toString();

    const merged = mergeCompanionsOnReplace(
      [{ id, name: "Relámpago", role: "Corcel", kind: "narrative", creatureId: new Types.ObjectId().toString(), hpCurrent: 1 }],
      [{
        id,
        name: "Viejo nombre",
        kind: "mount",
        creatureId,
        hpCurrent: 15,
        conditions: [conditionId],
      }]
    );

    expect(merged).toEqual([
      expect.objectContaining({
        id,
        name: "Relámpago",
        role: "Corcel",
        kind: "narrative",
        creatureId,
        hpCurrent: 15,
        conditions: [conditionId],
      }),
    ]);
  });

  it("does not copy state onto newly created companions", () => {
    const existingId = new Types.ObjectId().toString();
    const merged = mergeCompanionsOnReplace(
      [{ name: "Nuevo" }],
      [{ id: existingId, name: "Viejo", creatureId: new Types.ObjectId().toString(), hpCurrent: 8 }]
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].id).not.toBe(existingId);
    expect(merged[0].creatureId).toBeUndefined();
    expect(merged[0].hpCurrent).toBeUndefined();
  });
});

describe("companionRemovalConflict", () => {
  it("reports held items and vehicle draft", () => {
    const id = "comp1";
    expect(companionRemovalConflict([{ holderId: id }], id)).toBe("heldItems");
    expect(companionRemovalConflict([{ drawnBy: [id] }], id)).toBe("vehicleDraft");
    expect(companionRemovalConflict([{ holderId: "other" }], id)).toBeNull();
    expect(companionRemovalConflict([{ instanceId: "eq1", equipmentId: "eq1" }], id)).toBeNull();
  });
});
