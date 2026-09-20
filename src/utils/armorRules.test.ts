import { describe, expect, it } from "vitest";
import {
  applyArmorStrengthSpeedPenalty,
  applyAttributeBonus,
  collectEquippedArmorTypeIds,
  collectStealthDisadvantageSkillKeys,
  computeArmorClass,
  computeArmorPieceAc,
  findBodyArmor,
  findStackingArmor,
  isBodyArmorPiece,
  isStackingArmorPiece,
  isTraitSuppressedByArmor,
  isWearingArmorWithoutProficiency
} from "./armorRules";

const attributes = [
  { key: "str", name: "Fuerza", value: 12, modifier: 1 },
  { key: "dex", name: "Destreza", value: 16, modifier: 3 },
  { key: "con", name: "Constitución", value: 14, modifier: 2 },
  { key: "wis", name: "Sabiduría", value: 14, modifier: 2 }
] as any;

describe("armor piece classification", () => {
  it("treats slot armor as body armor", () => {
    expect(isBodyArmorPiece({
      equipSlot: "armor",
      armor: { class: { base: 12, attributeBonus: { key: "dex" } } }
    })).toBe(true);
  });

  it("treats off_hand armor as stacking", () => {
    const shield = {
      equipSlot: "off_hand",
      armor: { class: { base: 2 } }
    };
    expect(isStackingArmorPiece(shield)).toBe(true);
    expect(isBodyArmorPiece(shield)).toBe(false);
  });

  it("ignores armor pieces without equipSlot", () => {
    expect(isStackingArmorPiece({
      category: "Armadura",
      armor: { class: { base: 2 } }
    })).toBe(false);
    expect(isBodyArmorPiece({
      category: "Armadura",
      armor: { class: { base: 11, attributeBonus: { key: "dex" } } }
    })).toBe(false);
  });
});

describe("applyAttributeBonus", () => {
  it("does not clamp a negative modifier when there is no max", () => {
    expect(applyAttributeBonus(-1)).toBe(-1);
  });

  it("caps the modifier at max", () => {
    expect(applyAttributeBonus(3, 2)).toBe(2);
  });

  it("still applies a negative modifier when max is set", () => {
    expect(applyAttributeBonus(-2, 2)).toBe(-2);
  });
});

describe("computeArmorPieceAc", () => {
  it("adds dex modifier for light armor", () => {
    const ac = computeArmorPieceAc({
      armor: { class: { base: 12, attributeBonus: { key: "dex" } } }
    }, attributes);
    expect(ac).toBe(15);
  });

  it("adds no attribute bonus for heavy armor without attributeBonus", () => {
    const ac = computeArmorPieceAc({
      armor: { class: { base: 18 } }
    }, attributes);
    expect(ac).toBe(18);
  });

  it("adds magic +1", () => {
    const ac = computeArmorPieceAc({
      isMagic: true,
      armor: { class: { base: 11, attributeBonus: { key: "dex" } } }
    }, attributes);
    expect(ac).toBe(15);
  });

  it("caps attribute bonus at max", () => {
    const ac = computeArmorPieceAc({
      armor: { class: { base: 14, attributeBonus: { key: "dex", max: 2 } } }
    }, attributes);
    expect(ac).toBe(16);
  });
});

describe("computeArmorClass", () => {
  it("uses body armor plus uncapped attribute bonus", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: { class: { base: 12, attributeBonus: { key: "dex" } } }
      }],
      traits: [],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(15);
  });

  it("applies a negative attribute bonus to light armor", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: { class: { base: 11, attributeBonus: { key: "dex" } } }
      }],
      traits: [],
      attributes: [{ key: "dex", name: "Destreza", value: 8, modifier: -1 }] as any,
      baseUnarmoredAc: 9
    });
    expect(ca).toBe(10);
  });

  it("adds no attribute bonus when attributeBonus is omitted", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: { class: { base: 18 } }
      }],
      traits: [],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(18);
  });

  it("adds off_hand shield on top of body armor", () => {
    const ca = computeArmorClass({
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
      traits: [],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(18);
  });

  it("takes the max of unarmored formula traits", () => {
    const ca = computeArmorClass({
      equipment: [],
      traits: [{
        id: "barbarian-ud",
        acFormula: "10 + @attributes.dex.modifier + @attributes.con.modifier"
      }],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(15);
  });

  it("suppresses acFormula when matching type ids are equipped", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: {
          class: { base: 12, attributeBonus: { key: "dex" } },
          type: { id: "heavy-type" }
        }
      }],
      traits: [{
        id: "barbarian-ud",
        acFormula: "10 + @attributes.dex.modifier + @attributes.con.modifier",
        suppressedByArmorTypeIds: ["heavy-type"]
      }],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(15);
  });

  it("ignores traits without acFormula and stacks shields on baseUnarmoredAc", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "off_hand",
        armor: { class: { base: 2 } }
      }],
      traits: [{ id: "monk-unarmored-defense" }],
      attributes: [
        { key: "dex", name: "Destreza", value: 16, modifier: 3 },
        { key: "wis", name: "Sabiduría", value: 16, modifier: 3 }
      ] as any,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(15);
  });

  it("adds magic +1", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        isMagic: true,
        armor: { class: { base: 11, attributeBonus: { key: "dex" } } }
      }],
      traits: [],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(15);
  });

  it("adds armor_class bonuses from non-armor equipped items", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "ring",
        bonuses: { armor_class: 1 }
      }],
      traits: [],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(14);
  });

  it("uses the attribute key from the piece, not a global dex", () => {
    const ca = computeArmorClass({
      equipment: [{
        equipped: true,
        equipSlot: "armor",
        armor: { class: { base: 10, attributeBonus: { key: "wis" } } }
      }],
      traits: [],
      attributes,
      baseUnarmoredAc: 13
    });
    expect(ca).toBe(12);
  });
});

describe("type ids and side effects", () => {
  it("collects equipped armor type ids", () => {
    expect(collectEquippedArmorTypeIds([{
      equipped: true,
      armor: { type: { id: "heavy-type" } }
    }])).toEqual(["heavy-type"]);
  });

  it("suppresses traits only by type ids", () => {
    expect(isTraitSuppressedByArmor(
      { id: "speed", suppressedByArmorTypeIds: ["heavy-type"] },
      { typeIds: ["heavy-type"] }
    )).toBe(true);
    expect(isTraitSuppressedByArmor(
      { id: "speed", suppressedByArmorTypeIds: ["heavy-type"] },
      { typeIds: ["light-type"] }
    )).toBe(false);
    expect(isTraitSuppressedByArmor(
      { id: "speed" },
      { typeIds: ["heavy-type"] }
    )).toBe(false);
  });

  it("reduces walk speed when the required attribute is too low", () => {
    const body = findBodyArmor([{
      equipped: true,
      equipSlot: "armor",
      armor: {
        class: { base: 16 },
        attributeMinimum: { key: "str", value: 13, unmetSpeedPenalty: 10 }
      }
    }]);
    expect(applyArmorStrengthSpeedPenalty({ walk: 30 }, body, attributes)).toEqual({ walk: 20 });
    expect(applyArmorStrengthSpeedPenalty(
      { walk: 30 },
      body,
      [{ key: "str", name: "Fuerza", value: 13, modifier: 1 }] as any
    )).toEqual({ walk: 30 });
  });

  it("collects disadvantage skill keys from the piece", () => {
    expect(collectStealthDisadvantageSkillKeys([{
      equipped: true,
      armor: { disadvantageSkillKeys: ["stealth"] }
    }])).toEqual(["stealth"]);
    expect(collectStealthDisadvantageSkillKeys([{
      equipped: true,
      armor: { class: { base: 12 } }
    }])).toEqual([]);
  });

  it("flags unproficient equipped armor", () => {
    expect(isWearingArmorWithoutProficiency([{
      equipped: true,
      isProficient: false,
      armor: { class: { base: 12, attributeBonus: { key: "dex" } } }
    }])).toBe(true);
  });

  it("finds stacking vs body from a mixed loadout", () => {
    const items = [
      { equipped: true, equipSlot: "armor", armor: { class: { base: 14, attributeBonus: { key: "dex", max: 2 } } } },
      { equipped: true, equipSlot: "off_hand", armor: { class: { base: 2 } } }
    ];
    expect(findBodyArmor(items)?.equipSlot).toBe("armor");
    expect(findStackingArmor(items)).toHaveLength(1);
  });
});
