import { describe, expect, it } from "vitest";
import { normalizeCharacterDocument } from "./normalizeCharacterDocument";

describe("normalizeCharacterDocument", () => {
  it("maps legacy character document keys to the English shape", () => {
    const normalized = normalizeCharacterDocument({
      _id: "507f1f77bcf86cd799439011",
      name: "Astarion",
      HPMax: 18,
      HPActual: 11,
      XP: 300,
      CA: 14,
      traits_data: { rage: { uses: "2" } },
      prof_bonus: 2,
      saving_throws: ["dex", "cha"],
      proficiency_weapon: ["simple"],
      proficiency_armor: ["light"],
      classes: [{ class: "rogue-id", name: "Pícaro", level: 3, hit_die: "8" }],
      claseId: "rogue-id",
    });

    expect(normalized.ac).toBe(14);
    expect(normalized.hpMax).toBe(18);
    expect(normalized.hpCurrent).toBe(11);
    expect(normalized.xp).toBe(300);
    expect(normalized.traitsData).toEqual({ rage: { uses: "2" } });
    expect(normalized.proficiencyBonus).toBe(2);
    expect(normalized.savingThrows).toEqual(["dex", "cha"]);
    expect(normalized.weaponProficiencies).toEqual(["simple"]);
    expect(normalized.armorProficiencies).toEqual(["light"]);
    expect(normalized.classes).toEqual([
      { class: "rogue-id", name: "Pícaro", level: 3, hitDie: 8 },
    ]);
  });

  it("keeps already-migrated keys", () => {
    const normalized = normalizeCharacterDocument({
      hpMax: 40,
      hpCurrent: 32,
      xp: 900,
      traitsData: { rage: { uses: "3" } },
      proficiencyBonus: 3,
      savingThrows: ["str"],
      weaponProficiencies: ["martial"],
      armorProficiencies: ["medium"],
      classes: [{ class: "fighter-id", name: "Guerrero", level: 5, hitDie: 10 }],
    });

    expect(normalized.hpMax).toBe(40);
    expect(normalized.hpCurrent).toBe(32);
    expect(normalized.xp).toBe(900);
    expect(normalized.traitsData).toEqual({ rage: { uses: "3" } });
    expect(normalized.proficiencyBonus).toBe(3);
    expect(normalized.classes[0].hitDie).toBe(10);
  });
});
