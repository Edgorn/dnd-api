import { describe, expect, it } from "vitest";
import { computeArmorClass } from "./armorRules";
import { listArmorClass, storedAcNumber } from "./listArmorClass";

const FORMULA = "Math.floor((value - 10) / 2)";

describe("listArmorClass", () => {
  it("uses 10 + dex when unarmored", () => {
    const result = listArmorClass({
      attributes: [{ key: "dex", value: 14 }],
      traits: [],
      equipment: [],
      globalModifierFormula: FORMULA
    });

    expect(result.ac).toBe(12);
    expect(result.attributes).toEqual([{ key: "dex", value: 14 }]);
  });

  it("uses body armor with dex bonus", () => {
    const result = listArmorClass({
      attributes: [{ key: "dex", value: 16 }],
      traits: [],
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: { class: { base: 11, attributeBonus: { key: "dex" } } }
      }],
      globalModifierFormula: FORMULA
    });

    expect(result.ac).toBe(14);
  });

  it("adds a stacking shield", () => {
    const result = listArmorClass({
      attributes: [{ key: "dex", value: 10 }],
      traits: [],
      equipment: [
        {
          equipped: true,
          equipSlot: "armor",
          armor: { class: { base: 16 } }
        },
        {
          equipped: true,
          equipSlot: "off_hand",
          armor: { class: { base: 2 } }
        }
      ],
      globalModifierFormula: FORMULA
    });

    expect(result.ac).toBe(18);
  });

  it("applies trait ability scores before acFormula", () => {
    const result = listArmorClass({
      attributes: [
        { key: "dex", value: 14 },
        { key: "con", value: 14 }
      ],
      traits: [{
        id: "unarmored",
        abilityScores: [{ key: "dex", bonus: 2 }],
        acFormula: "10 + @attributes.dex.modifier + @attributes.con.modifier"
      }],
      equipment: [],
      globalModifierFormula: FORMULA
    });

    expect(result.attributes.find(attribute => attribute.key === "dex")?.value).toBe(16);
    expect(result.ac).toBe(15);
  });

  it("suppresses acFormula when matching armor type is equipped", () => {
    const result = listArmorClass({
      attributes: [{ key: "dex", value: 16 }, { key: "con", value: 16 }],
      traits: [{
        id: "unarmored",
        acFormula: "10 + @attributes.dex.modifier + @attributes.con.modifier",
        suppressedByArmorTypeIds: ["heavy-type"]
      }],
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: {
          class: { base: 12, attributeBonus: { key: "dex" } },
          type: { id: "heavy-type" }
        }
      }],
      globalModifierFormula: FORMULA
    });

    expect(result.ac).toBe(15);
  });

  it("matches computeArmorClass on the same overlayed attributes and equipment", () => {
    const traits = [{
      id: "ring",
      bonuses: { armor_class: 1 }
    }];
    const equipment = [{
      equipped: true,
      equipSlot: "armor",
      armor: { class: { base: 12, attributeBonus: { key: "dex" } } }
    }];
    const attributes = [
      { key: "dex", value: 16, modifier: 3, name: "Destreza" }
    ];

    const computed = computeArmorClass({
      equipment,
      traits,
      attributes: attributes as never,
      baseUnarmoredAc: 13
    });
    const listed = listArmorClass({
      attributes: [{ key: "dex", value: 16 }],
      traits,
      equipment,
      globalModifierFormula: FORMULA
    });

    expect(listed.ac).toBe(computed);
  });
});

describe("storedAcNumber", () => {
  it("keeps finite numbers and rejects the rest", () => {
    expect(storedAcNumber(16)).toBe(16);
    expect(storedAcNumber(0)).toBe(0);
    expect(storedAcNumber(Number.NaN)).toBeUndefined();
    expect(storedAcNumber("14")).toBeUndefined();
    expect(storedAcNumber(undefined)).toBeUndefined();
  });
});
