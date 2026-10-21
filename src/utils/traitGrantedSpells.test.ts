import { describe, expect, it } from "vitest";
import { grantedExtraSpellIdsByClass, mergeExtraSpellIds } from "./traitGrantedSpells";

const findFamiliar = "spell-familiar";
const chainTrait = "trait-chain";
const warlock = "class-warlock";

describe("grantedExtraSpellIdsByClass", () => {
  it("puts extra spells on the class of the option selection", () => {
    const result = grantedExtraSpellIdsByClass({
      traits: [{ id: chainTrait, grantedSpells: [findFamiliar] }],
      optionSelections: [{ traitId: chainTrait, classId: warlock }],
      classes: [{ class: warlock, level: 3 }],
      classCatalogs: [{ id: warlock, levels: [] }],
      subclasses: []
    });
    expect(result).toEqual({ [warlock]: [findFamiliar] });
  });

  it("omits extras when the trait is not owned", () => {
    const result = grantedExtraSpellIdsByClass({
      traits: [],
      optionSelections: [{ traitId: chainTrait, classId: warlock }],
      classes: [{ class: warlock, level: 3 }],
      classCatalogs: [{ id: warlock, levels: [{ level: 1, traits: [chainTrait] }] }],
      subclasses: []
    });
    expect(result).toEqual({});
  });

  it("uses race when no class granted the trait", () => {
    const result = grantedExtraSpellIdsByClass({
      traits: [{ id: chainTrait, grantedSpells: [{ id: findFamiliar }] }],
      optionSelections: [],
      classes: [{ class: warlock, level: 1 }],
      classCatalogs: [{ id: warlock, levels: [] }],
      subclasses: []
    });
    expect(result).toEqual({ race: [findFamiliar] });
  });
});

describe("mergeExtraSpellIds", () => {
  it("does not duplicate known spells", () => {
    expect(mergeExtraSpellIds(["a", "b"], ["b", "c"], ["c"])).toEqual(["a", "b"]);
  });
});
