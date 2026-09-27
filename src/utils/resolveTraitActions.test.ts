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
  });

  it("leaves traits without a save formula unchanged", () => {
    const plain = breath();
    delete plain.action;
    const [resolved] = resolveTraitActions([plain], [constitution], 3);

    expect(resolved).toEqual(plain);
    expect(resolved.description).toEqual(["CD {dc}."]);
  });
});
