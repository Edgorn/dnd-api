import { describe, expect, it } from "vitest";
import {
  buildCompanionSheetMarks,
  formatCompanionSheetRow,
  isPdfTreasureItem,
  mergeSheetSpells,
  pdfMagicBonusSuffix,
  prefixSheetMark,
  shortenPdfArmorName,
} from "./escribirPdf";
import { SpellApi } from "../domain/types/spell.types";

const spell = (partial: Pick<SpellApi, "name" | "level"> & Partial<SpellApi>): SpellApi => ({
  ruleset: "dnd5e",
  classes: [],
  description: [],
  tables: [],
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

  it("prefixes the holder mark when provided", () => {
    expect(formatCompanionSheetRow({ name: "Relámpago", role: "Montura" }, "†")).toBe(
      "† Relámpago (Montura)",
    );
  });
});

describe("buildCompanionSheetMarks", () => {
  const horse = { id: "horse" };
  const mule = { id: "mule" };
  const steward = { id: "steward" };

  it("assigns the same mark to a companion and its held item", () => {
    const marks = buildCompanionSheetMarks(
      [horse],
      [{ instanceId: "pack", holderId: "horse" }],
    );

    expect(marks.byCompanionId.get("horse")).toBe("*");
    expect(marks.byInstanceId.get("pack")).toBe("*");
    expect(prefixSheetMark(marks.byInstanceId.get("pack"), "1x Mochila")).toBe("* 1x Mochila");
  });

  it("walks nested containers to the companion", () => {
    const marks = buildCompanionSheetMarks(
      [horse],
      [
        { instanceId: "pack", holderId: "horse" },
        { instanceId: "ration", holderId: "pack" },
      ],
    );

    expect(marks.byCompanionId.get("horse")).toBe("*");
    expect(marks.byInstanceId.get("pack")).toBe("*");
    expect(marks.byInstanceId.get("ration")).toBe("*");
  });

  it("leaves companions without held items unmarked", () => {
    const marks = buildCompanionSheetMarks(
      [steward, horse],
      [{ instanceId: "pack", holderId: "horse" }],
    );

    expect(marks.byCompanionId.has("steward")).toBe(false);
    expect(marks.byCompanionId.get("horse")).toBe("*");
  });

  it("assigns marks in roster order, not inventory order", () => {
    const marks = buildCompanionSheetMarks(
      [horse, mule],
      [
        { instanceId: "saddle-mule", holderId: "mule" },
        { instanceId: "saddle-horse", holderId: "horse" },
      ],
    );

    expect(marks.byCompanionId.get("horse")).toBe("*");
    expect(marks.byCompanionId.get("mule")).toBe("†");
    expect(marks.byInstanceId.get("saddle-horse")).toBe("*");
    expect(marks.byInstanceId.get("saddle-mule")).toBe("†");
  });

  it("does not mark character-held items or holder cycles", () => {
    const marks = buildCompanionSheetMarks(
      [horse],
      [
        { instanceId: "sword", holderId: null },
        { instanceId: "a", holderId: "b" },
        { instanceId: "b", holderId: "a" },
      ],
    );

    expect(marks.byCompanionId.size).toBe(0);
    expect(marks.byInstanceId.size).toBe(0);
  });
});

describe("isPdfTreasureItem", () => {
  it("keeps weapons in the equipment box", () => {
    expect(isPdfTreasureItem({ weapon: { damage: [] } })).toBe(false);
  });

  it("keeps slotted armor in the equipment box", () => {
    expect(isPdfTreasureItem({ equipSlot: "armor" })).toBe(false);
  });

  it("keeps mundane gear without a slot in treasure", () => {
    expect(isPdfTreasureItem({})).toBe(true);
  });

  it("moves catalog magic items with rarityKey to the equipment box", () => {
    expect(isPdfTreasureItem({ rarityKey: "uncommon" })).toBe(false);
  });

  it("moves isMagic items without a slot to the equipment box", () => {
    expect(isPdfTreasureItem({ isMagic: true })).toBe(false);
  });

  it("treats blank rarityKey as mundane treasure", () => {
    expect(isPdfTreasureItem({ rarityKey: "   " })).toBe(true);
    expect(isPdfTreasureItem({ rarityKey: null })).toBe(true);
  });
});

describe("pdfMagicBonusSuffix", () => {
  it("appends +1 to a magic weapon", () => {
    expect(pdfMagicBonusSuffix({ isMagic: true, weapon: { damage: [] } })).toBe(" +1");
  });

  it("appends +1 to magic slotted armor", () => {
    expect(pdfMagicBonusSuffix({ isMagic: true, equipSlot: "armor" })).toBe(" +1");
  });

  it("does not append +1 to magic items without weapon or slot", () => {
    expect(pdfMagicBonusSuffix({ isMagic: true })).toBe("");
  });

  it("does not append +1 to mundane weapons or armor", () => {
    expect(pdfMagicBonusSuffix({ weapon: { damage: [] } })).toBe("");
    expect(pdfMagicBonusSuffix({ equipSlot: "armor" })).toBe("");
  });
});

describe("shortenPdfArmorName", () => {
  it("strips the Armadura de prefix", () => {
    expect(shortenPdfArmorName("Armadura de cuero tachonado")).toBe("Cuero tachonado");
    expect(shortenPdfArmorName("Armadura de placas")).toBe("Placas");
  });

  it("leaves names without the prefix unchanged", () => {
    expect(shortenPdfArmorName("Cota de mallas")).toBe("Cota de mallas");
    expect(shortenPdfArmorName("")).toBe("");
    expect(shortenPdfArmorName("Cuero")).toBe("Cuero");
  });
});
