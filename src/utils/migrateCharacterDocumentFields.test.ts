import { describe, expect, it } from "vitest";
import { migrateCharacterDocumentFields } from "./migrateCharacterDocumentFields";

describe("migrateCharacterDocumentFields", () => {
  it("maps a fully legacy document", () => {
    const ops = migrateCharacterDocumentFields({
      HPMax: 18,
      HPActual: 11,
      XP: 300,
      traits_data: { rage: { uses: "2" } },
      prof_bonus: 2,
      saving_throws: ["dex"],
      proficiency_weapon: ["simple"],
      proficiency_armor: ["light"],
      classes: [{ class: "rogue-id", name: "Pícaro", level: 3, hit_die: "8" }],
    });

    expect(ops).toEqual({
      $set: {
        hpMax: 18,
        hpCurrent: 11,
        xp: 300,
        traitsData: { rage: { uses: "2" } },
        proficiencyBonus: 2,
        savingThrows: ["dex"],
        weaponProficiencies: ["simple"],
        armorProficiencies: ["light"],
        classes: [{ class: "rogue-id", name: "Pícaro", level: 3, hitDie: 8 }],
      },
      $unset: {
        HPMax: "",
        HPActual: "",
        XP: "",
        traits_data: "",
        prof_bonus: "",
        saving_throws: "",
        proficiency_weapon: "",
        proficiency_armor: "",
      },
    });
  });

  it("keeps already-migrated values and only unsets leftover legacy keys", () => {
    const ops = migrateCharacterDocumentFields({
      hpMax: 40,
      HPMax: 18,
      hpCurrent: 32,
      HPActual: 11,
      xp: 900,
      XP: 300,
      classes: [{ class: "fighter-id", name: "Guerrero", level: 5, hitDie: 10, hit_die: "8" }],
    });

    expect(ops?.$set).toEqual({
      classes: [{ class: "fighter-id", name: "Guerrero", level: 5, hitDie: 10 }],
    });
    expect(ops?.$unset).toEqual({
      HPMax: "",
      HPActual: "",
      XP: "",
    });
  });

  it("returns null when the document is already migrated", () => {
    expect(migrateCharacterDocumentFields({
      hpMax: 40,
      hpCurrent: 32,
      xp: 900,
      traitsData: {},
      proficiencyBonus: 3,
      savingThrows: ["str"],
      weaponProficiencies: ["martial"],
      armorProficiencies: ["medium"],
      classes: [{ class: "fighter-id", name: "Guerrero", level: 5, hitDie: 10 }],
    })).toBeNull();
  });

  it("converts string hit_die on class rows", () => {
    const ops = migrateCharacterDocumentFields({
      classes: [{ class: "wizard-id", name: "Mago", level: 1, hit_die: "6" }],
    });

    expect(ops?.$set.classes).toEqual([
      { class: "wizard-id", name: "Mago", level: 1, hitDie: 6 },
    ]);
  });
});
