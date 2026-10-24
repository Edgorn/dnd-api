import { describe, expect, it } from "vitest";
import {
  grantedExtraSpellIdsByClass,
  mergeExtraSpellIds,
  ritualOnlyExtraSpellIds,
  ritualOnlyGrantedExtraIdsByClass
} from "./traitGrantedSpells";

const findFamiliar = "spell-familiar";
const chainTrait = "trait-chain";
const warlock = "class-warlock";

describe("grantedExtraSpellIdsByClass", () => {
  it("puts extra spells on the class of the option selection", () => {
    const result = grantedExtraSpellIdsByClass({
      traits: [{ id: chainTrait, grantedSpells: [{ spellId: findFamiliar, ritualOnly: false }] }],
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
      traits: [{ id: chainTrait, grantedSpells: [{ spellId: findFamiliar, ritualOnly: false }] }],
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

describe("ritualOnlyGrantedExtraIdsByClass", () => {
  it("marks a spell only when every granting trait is ritual-only", () => {
    const input = {
      traits: [
        { id: chainTrait, grantedSpells: [{ spellId: findFamiliar, ritualOnly: true }] }
      ],
      optionSelections: [{ traitId: chainTrait, classId: warlock }],
      classes: [{ class: warlock, level: 3 }],
      classCatalogs: [{ id: warlock, levels: [] }],
      subclasses: []
    };
    expect(ritualOnlyGrantedExtraIdsByClass(input)).toEqual({ [warlock]: [findFamiliar] });
  });

  it("drops ritual-only when another trait grants the same spell with slots", () => {
    const other = "trait-other";
    const result = ritualOnlyGrantedExtraIdsByClass({
      traits: [
        { id: chainTrait, grantedSpells: [{ spellId: findFamiliar, ritualOnly: true }] },
        { id: other, grantedSpells: [{ spellId: findFamiliar, ritualOnly: false }] }
      ],
      optionSelections: [
        { traitId: chainTrait, classId: warlock },
        { traitId: other, classId: warlock }
      ],
      classes: [{ class: warlock, level: 3 }],
      classCatalogs: [{ id: warlock, levels: [] }],
      subclasses: []
    });
    expect(result).toEqual({});
  });
});

describe("ritualOnlyExtraSpellIds", () => {
  it("omits persisted extras and privilege extras", () => {
    expect(ritualOnlyExtraSpellIds({
      extraIds: ["ritual", "copied", "privilege"],
      persistedExtraIds: ["copied"],
      otherDerivedExtraIds: ["privilege"],
      ritualOnlyFromTraits: ["ritual", "copied", "privilege"]
    })).toEqual(["ritual"]);
  });
});
