import { describe, expect, it } from "vitest";
import { formatCompanionSheetRow, mergeSheetSpells } from "./escribirPdf";
import { SpellApi } from "../domain/types/spell.types";

const spell = (partial: Pick<SpellApi, "name" | "level"> & Partial<SpellApi>): SpellApi => ({
  ruleset: "dnd5e",
  classes: [],
  description: [],
  ...partial,
});

describe("mergeSheetSpells", () => {
  it("includes prepared spells when the known list is empty", () => {
    const prepared = [
      spell({ id: "1", name: "Curar heridas", level: 1 }),
      spell({ id: "2", name: "Bendición", level: 1 }),
      spell({ id: "3", name: "Escudo de fe", level: 1 }),
    ];

    const merged = mergeSheetSpells([], prepared);

    expect(merged).toHaveLength(3);
    expect(merged.map((s) => s.name)).toEqual(["Curar heridas", "Bendición", "Escudo de fe"]);
  });

  it("merges cantrips from list with prepared leveled spells", () => {
    const list = [spell({ id: "c1", name: "Luz", level: 0 })];
    const prepared = [spell({ id: "p1", name: "Curar heridas", level: 1 })];

    const merged = mergeSheetSpells(list, prepared);

    expect(merged).toHaveLength(2);
    expect(merged.map((s) => s.name)).toEqual(["Luz", "Curar heridas"]);
  });

  it("does not duplicate spells present in both list and prepared", () => {
    const shared = spell({ id: "same", name: "Curar heridas", level: 1 });
    const merged = mergeSheetSpells([shared], [shared]);

    expect(merged).toHaveLength(1);
    expect(merged[0].name).toBe("Curar heridas");
  });

  it("deduplicates by name when id is missing", () => {
    const fromList = spell({ name: "Bendición", level: 1 });
    const fromPrepared = spell({ name: "Bendición", level: 1 });

    expect(mergeSheetSpells([fromList], [fromPrepared])).toHaveLength(1);
  });
});

describe("formatCompanionSheetRow", () => {
  it("formats name only", () => {
    expect(formatCompanionSheetRow({ name: "Aldric" })).toBe("Aldric");
  });

  it("includes role in parentheses", () => {
    expect(formatCompanionSheetRow({ name: "Aldric", role: "Mayordomo" })).toBe("Aldric (Mayordomo)");
  });

  it("appends notes after a period on the same row", () => {
    expect(
      formatCompanionSheetRow({
        name: "Aldric",
        role: "Mayordomo",
        notes: "Leal a la familia",
      }),
    ).toBe("Aldric (Mayordomo). Leal a la familia");
  });
});
