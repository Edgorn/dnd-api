import { describe, it, expect } from "vitest";
import {
  buildPendingOptionChoices,
  mapSubclassMenuOptionChoices,
  mergeOptionChoices,
  optionReplacementsToChoices,
  subclassMenuOptionChoiceGroupIds,
  validateLevelUpOptionPicks
} from "./characterOptionChoices";
import { PrerequisiteContext } from "../domain/types/prerequisite.types";
import { CharacterOptionSelection, GroupOptionApi } from "../domain/types/optionGroup.types";

const GROUP = "507f1f77bcf86cd799439011";
const OPT_A = "507f1f77bcf86cd799439021";
const OPT_B = "507f1f77bcf86cd799439022";
const OPT_C = "507f1f77bcf86cd799439023";
const OPT_D = "507f1f77bcf86cd799439024";
const TRAIT_A = "507f1f77bcf86cd799439031";
const TRAIT_B = "507f1f77bcf86cd799439032";
const TRAIT_C = "507f1f77bcf86cd799439033";
const TRAIT_D = "507f1f77bcf86cd799439034";
const PACT = "507f1f77bcf86cd799439041";

function context(overrides: Partial<PrerequisiteContext> = {}): PrerequisiteContext {
  return {
    grantingClassId: "warlock",
    classLevels: { warlock: 5 },
    characterLevel: 5,
    traitIds: [PACT],
    spellIds: [],
    attributes: [],
    ...overrides
  };
}

function option(id: string, traitId: string, extras: Partial<GroupOptionApi> = {}): GroupOptionApi {
  return {
    id,
    ruleset: "srd",
    groupId: GROUP,
    traitId,
    ...extras
  };
}

const catalog = [
  option(OPT_A, TRAIT_A),
  option(OPT_B, TRAIT_B, { prerequisites: { type: "trait", traitId: PACT } }),
  option(OPT_C, TRAIT_C, { prerequisites: { type: "classLevel", min: 9 } }),
  option(OPT_D, TRAIT_D, { prerequisites: { type: "trait", traitId: TRAIT_A } })
];

describe("mergeOptionChoices", () => {
  it("sums choose and replace for the same group", () => {
    expect(mergeOptionChoices(
      [{ groupId: GROUP, choose: 1 }],
      [{ groupId: GROUP, choose: 0, replace: 1 }]
    )).toEqual([{ groupId: GROUP, choose: 1, replace: 1 }]);
  });
});

describe("optionReplacementsToChoices", () => {
  const classId = "warlock";
  const configs = [{ groupId: GROUP, count: 1 }];
  const owned: CharacterOptionSelection[] = [{
    optionId: OPT_A,
    groupId: GROUP,
    traitId: TRAIT_A,
    classId,
    level: 2
  }];

  it("emits nothing when the character has no selections for the group", () => {
    expect(optionReplacementsToChoices(configs, [], classId)).toEqual([]);
  });

  it("emits a replace-only choice when the character already has a selection", () => {
    expect(optionReplacementsToChoices(configs, owned, classId)).toEqual([
      { groupId: GROUP, choose: 0, replace: 1 }
    ]);
  });

  it("ignores selections from another class", () => {
    expect(optionReplacementsToChoices(configs, [{ ...owned[0], classId: "fighter" }], classId)).toEqual([]);
  });

  it("merges with a level choose into choose plus replace", () => {
    expect(mergeOptionChoices(
      [{ groupId: GROUP, choose: 1 }],
      optionReplacementsToChoices(configs, owned, classId)
    )).toEqual([{ groupId: GROUP, choose: 1, replace: 1 }]);
  });
});

describe("buildPendingOptionChoices", () => {
  it("hides already chosen non-repeatable options and marks unmet ones", () => {
    const selected: CharacterOptionSelection[] = [{
      optionId: OPT_A,
      groupId: GROUP,
      traitId: TRAIT_A,
      classId: "warlock",
      level: 2
    }];

    const pending = buildPendingOptionChoices({
      configs: [{ groupId: GROUP, choose: 1, replace: 1 }],
      options: catalog,
      selections: selected,
      context: context(),
      groupNames: { [GROUP]: "Invocaciones" }
    });

    expect(pending).toHaveLength(1);
    expect(pending[0].options.map(item => item.id)).toEqual([OPT_B, OPT_C, OPT_D]);
    expect(pending[0].options.find(item => item.id === OPT_B)?.available).toBe(true);
    expect(pending[0].options.find(item => item.id === OPT_C)?.unmet).toBe(true);
    expect(pending[0].options.find(item => item.id === OPT_D)?.unmet).toBe(true);
    expect(pending[0].selected).toEqual(selected);
  });

  it("sorts offered options alphabetically by trait name", () => {
    const named = [
      option(OPT_B, TRAIT_B, { trait: { name: "Visión diabólica" } as GroupOptionApi["trait"] }),
      option(OPT_C, TRAIT_C, { trait: { name: "Agonía" } as GroupOptionApi["trait"] }),
      option(OPT_D, TRAIT_D, { trait: { name: "Llamar al familiar" } as GroupOptionApi["trait"] })
    ];

    const pending = buildPendingOptionChoices({
      configs: [{ groupId: GROUP, choose: 1 }],
      options: named,
      selections: [],
      context: context(),
      groupNames: { [GROUP]: "Invocaciones" }
    });

    expect(pending[0].options.map(item => item.trait?.name)).toEqual([
      "Agonía",
      "Llamar al familiar",
      "Visión diabólica"
    ]);
  });
});

describe("mapSubclassMenuOptionChoices", () => {
  const pending = [{
    groupId: GROUP,
    groupName: "Espíritus totémicos",
    choose: 1,
    options: catalog.map(item => ({ ...item, available: true, unmet: false })),
    selected: []
  }];

  it("hydrates optionChoices on subclass levels that have configs and leaves the rest intact", () => {
    const menu = [
      {
        name: "Senda del Berserker",
        levels: [
          { level: 3, traits: ["frenzy"] },
          { level: 6, traits: ["mindless"] }
        ]
      },
      {
        name: "Senda del Guerrero Totémico",
        levels: [
          { level: 3, traits: ["spirit"], optionChoices: [{ groupId: GROUP, choose: 1 }] },
          { level: 6, traits: ["aspect"] }
        ]
      }
    ];

    const hydrated = mapSubclassMenuOptionChoices(menu, configs => {
      expect(configs).toEqual([{ groupId: GROUP, choose: 1 }]);
      return pending;
    });

    expect(hydrated[0]).toEqual(menu[0]);
    expect(hydrated[1].levels[0].optionChoices).toEqual(pending);
    expect(hydrated[1].levels[1]).toEqual(menu[1].levels[1]);
    expect(subclassMenuOptionChoiceGroupIds(menu)).toEqual([GROUP]);
  });
});

describe("validateLevelUpOptionPicks", () => {
  const options = catalog.map(item => ({
    id: item.id,
    groupId: item.groupId,
    traitId: item.traitId,
    prerequisites: item.prerequisites,
    repeatable: item.repeatable
  }));

  it("requires the offered number of new options", () => {
    const result = validateLevelUpOptionPicks({
      configs: [{ groupId: GROUP, choose: 1 }],
      options,
      selections: [],
      picks: [],
      context: context(),
      classId: "warlock",
      level: 2
    });
    expect("error" in result).toBe(true);
  });

  it("applies adds and replacements", () => {
    const previous: CharacterOptionSelection[] = [{
      optionId: OPT_A,
      groupId: GROUP,
      traitId: TRAIT_A,
      classId: "warlock",
      level: 2
    }];
    const result = validateLevelUpOptionPicks({
      configs: [{ groupId: GROUP, choose: 1, replace: 1 }],
      options,
      selections: previous,
      picks: [{
        groupId: GROUP,
        add: [OPT_B],
        replace: [{ from: OPT_A, to: OPT_A }]
      }],
      context: context(),
      extraTraitIds: [PACT],
      classId: "warlock",
      level: 5
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.selections.map(item => item.optionId).sort()).toEqual([OPT_A, OPT_B]);
    expect(result.addedTraitIds).toEqual([TRAIT_B]);
    expect(result.removedTraitIds).toEqual([]);
  });

  it("rejects an option whose prerequisite is not met", () => {
    const result = validateLevelUpOptionPicks({
      configs: [{ groupId: GROUP, choose: 1 }],
      options,
      selections: [],
      picks: [{ groupId: GROUP, add: [OPT_C] }],
      context: context(),
      classId: "warlock",
      level: 5
    });
    expect(result).toEqual({ error: "El personaje no cumple los requisitos de una opción elegida" });
  });

  it("rejects remaining selections that lose their prerequisite", () => {
    const previous: CharacterOptionSelection[] = [{
      optionId: OPT_B,
      groupId: GROUP,
      traitId: TRAIT_B,
      classId: "warlock",
      level: 2
    }];
    const result = validateLevelUpOptionPicks({
      configs: [{ groupId: GROUP, choose: 0, replace: 0 }],
      options,
      selections: previous,
      picks: [{ groupId: GROUP, add: [] }],
      context: context({ traitIds: [] }),
      classId: "warlock",
      level: 6
    });
    expect(result).toEqual({ error: "Hay opciones ya elegidas que dejan de cumplir sus requisitos" });
  });

  it("accepts an option whose required trait is granted by another pick in the same level-up", () => {
    const result = validateLevelUpOptionPicks({
      configs: [{ groupId: GROUP, choose: 2 }],
      options,
      selections: [],
      picks: [{ groupId: GROUP, add: [OPT_A, OPT_D] }],
      context: context({ traitIds: [] }),
      classId: "warlock",
      level: 2
    });

    expect("error" in result).toBe(false);
    if ("error" in result) return;
    expect(result.selections.map(item => item.optionId).sort()).toEqual([OPT_A, OPT_D]);
    expect(result.addedTraitIds.sort()).toEqual([TRAIT_A, TRAIT_D]);
  });

  it("rejects an option whose required trait is removed by a replacement in the same level-up", () => {
    const previous: CharacterOptionSelection[] = [{
      optionId: OPT_A,
      groupId: GROUP,
      traitId: TRAIT_A,
      classId: "warlock",
      level: 2
    }];
    const result = validateLevelUpOptionPicks({
      configs: [{ groupId: GROUP, choose: 0, replace: 1 }],
      options,
      selections: previous,
      picks: [{
        groupId: GROUP,
        add: [],
        replace: [{ from: OPT_A, to: OPT_D }]
      }],
      context: context({ traitIds: [] }),
      classId: "warlock",
      level: 5
    });
    expect(result).toEqual({ error: "El personaje no cumple los requisitos de una opción elegida" });
  });
});
