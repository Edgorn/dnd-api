import { describe, expect, it } from "vitest";
import {
  subclassAlwaysPreparedSpellIds,
  subclassAlwaysPreparedSpellRowsAtLevel
} from "./subclassAlwaysPreparedSpells";

const cleric = "class-cleric";
const bless = "spell-bless";
const spiritualWeapon = "spell-spiritual-weapon";

const lifeDomain = {
  classId: cleric,
  alwaysPreparedSpells: [
    { atLevel: 1, spellIds: [bless] },
    { atLevel: 3, spellIds: [spiritualWeapon] }
  ]
};

describe("subclassAlwaysPreparedSpellIds", () => {
  it("unlocks domain spells at the class level", () => {
    expect(subclassAlwaysPreparedSpellIds([lifeDomain], cleric, 1)).toEqual([bless]);
  });

  it("includes later domain spells when the class level is high enough", () => {
    expect(subclassAlwaysPreparedSpellIds([lifeDomain], cleric, 3)).toEqual([
      bless,
      spiritualWeapon
    ]);
  });

  it("ignores subclasses of other classes", () => {
    expect(subclassAlwaysPreparedSpellIds([lifeDomain], "class-paladin", 20)).toEqual([]);
  });
});

describe("subclassAlwaysPreparedSpellRowsAtLevel", () => {
  it("returns the domain spells unlocked at that class level", () => {
    expect(subclassAlwaysPreparedSpellRowsAtLevel([lifeDomain], cleric, 3)).toEqual([
      { atLevel: 3, spellIds: [spiritualWeapon] }
    ]);
  });

  it("returns nothing when no row matches the class level", () => {
    expect(subclassAlwaysPreparedSpellRowsAtLevel([lifeDomain], cleric, 2)).toEqual([]);
  });

  it("ignores subclasses of other classes", () => {
    expect(subclassAlwaysPreparedSpellRowsAtLevel([lifeDomain], "class-paladin", 3)).toEqual([]);
  });

  it("merges duplicate spell ids from matching rows", () => {
    expect(
      subclassAlwaysPreparedSpellRowsAtLevel(
        [
          lifeDomain,
          {
            classId: cleric,
            alwaysPreparedSpells: [
              { atLevel: 3, spellIds: [spiritualWeapon, "spell-beacon"] }
            ]
          }
        ],
        cleric,
        3
      )
    ).toEqual([{ atLevel: 3, spellIds: [spiritualWeapon, "spell-beacon"] }]);
  });
});
