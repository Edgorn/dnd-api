import { describe, expect, it } from "vitest";
import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { TraitApi } from "../domain/types/traits.types";
import { resolveTraitActions } from "./resolveTraitActions";

const constitution: CharacterAttributeApi = {
  id: "con-id",
  name: "Constitución",
  key: "con",
  value: 14,
  modifier: 2
};

const breath = (): TraitApi => ({
  id: "breath",
  name: "Aliento",
  description: ["CD {dc}."],
  summary: ["{dc}"],
  ruleset: "dnd5e",
  incompatible_traits: [],
  resistances: [],
  conditional_resistances: [],
  condition_inmunities: [],
  proficiencies: [],
  action: {
    activation: "action",
    saveDcFormula: "8 + @attributes.con.modifier + @proficiencyBonus",
    uses: 1,
    recharge: "shortOrLongRest"
  }
});

describe("resolveTraitActions", () => {
  it("calculates saveDc and replaces {dc} in description and summary", () => {
    const [resolved] = resolveTraitActions([breath()], [constitution], 3);

    expect(resolved.action?.saveDc).toBe(13);
    expect(resolved.description).toEqual(["CD 13."]);
    expect(resolved.summary).toEqual(["13"]);
    expect(resolved.action?.uses).toBe(1);
    expect(resolved.action?.remaining).toBe(1);
  });

  it("leaves traits without a save formula unchanged", () => {
    const plain = breath();
    delete plain.action;
    const [resolved] = resolveTraitActions([plain], [constitution], 3);

    expect(resolved).toEqual(plain);
    expect(resolved.description).toEqual(["CD {dc}."]);
  });

  it("resolves uses, remaining and stance active from class level and character state", () => {
    const rage: TraitApi = {
      ...breath(),
      id: "rage",
      action: {
        activation: "bonusAction",
        kind: "stance",
        uses: 2,
        usesByClassLevel: { "1": 2, "3": 3, "6": 4 }
      },
      weaponDamageBonus: {
        when: "active",
        melee: true,
        abilityKeys: ["str"],
        amount: 2,
        amountByClassLevel: { "1": 2, "9": 3 }
      }
    };

    const [resolved] = resolveTraitActions([rage], [constitution], 3, {
      grantingClassLevelByTraitId: new Map([["rage", 5]]),
      spentByTraitId: new Map([["rage", 1]]),
      activeTraitIds: new Set(["rage"])
    });

    expect(resolved.action?.uses).toBe(3);
    expect(resolved.action?.remaining).toBe(2);
    expect(resolved.action?.active).toBe(true);
    expect(resolved.weaponDamageBonus?.amount).toBe(2);
  });
});
