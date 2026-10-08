import { describe, it, expect } from "vitest";
import { Damage } from "../domain/types";
import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { RaceRef } from "../domain/types/race.types";
import { TraitApi } from "../domain/types/traits.types";
import {
  applyTraitStacking,
  closeLevelUpTraitText,
  damageChoiceSourceIdsToLoad,
  mergeClassAndRaceLevelUp,
  mergeLevelUpTraits,
  levelUpTraitIds,
  mergeRaceLevelRows,
  orderTraitsByIds,
  traitIdsWithChangedData
} from "./characterLevelUpTraits";

const trait = (id: string, extra: Partial<TraitApi> = {}): TraitApi => ({
  id,
  name: id,
  description: [],
  summary: [],
  ruleset: "dnd5e",
  incompatible_traits: [],
  resistances: [],
  conditional_resistances: [],
  condition_inmunities: [],
  proficiencies: [],
  ...extra
});

describe("applyTraitStacking", () => {
  it("skips an exclusive stackGroup already owned", () => {
    const owned = [trait("monk-ac", { stackGroup: { key: "unarmored-defense", policy: "exclusive" } })];
    const incoming = [trait("barb-ac", { stackGroup: { key: "unarmored-defense", policy: "exclusive" } })];

    const result = applyTraitStacking(owned, incoming);

    expect(result.granted).toEqual([]);
    expect(result.nextIds).toEqual(["monk-ac"]);
  });

  it("replaces a lower-rank max stackGroup with the higher rank", () => {
    const owned = [trait("extra-2", { stackGroup: { key: "extra-attack", policy: "max", rank: 2 } })];
    const incoming = [trait("extra-3", { stackGroup: { key: "extra-attack", policy: "max", rank: 3 } })];

    const result = applyTraitStacking(owned, incoming);

    expect(result.granted.map(item => item.id)).toEqual(["extra-3"]);
    expect(result.nextIds).toEqual(["extra-3"]);
  });

  it("keeps the owned max stackGroup when the incoming rank is lower or equal", () => {
    const owned = [trait("extra-3", { stackGroup: { key: "extra-attack", policy: "max", rank: 3 } })];
    const incoming = [trait("extra-2", { stackGroup: { key: "extra-attack", policy: "max", rank: 2 } })];

    const result = applyTraitStacking(owned, incoming);

    expect(result.granted).toEqual([]);
    expect(result.nextIds).toEqual(["extra-3"]);
  });

  it("skips an incoming trait incompatible with one already owned", () => {
    const owned = [trait("path-light")];
    const incoming = [trait("path-dark", { incompatible_traits: [trait("path-light")] })];

    const result = applyTraitStacking(owned, incoming);

    expect(result.granted).toEqual([]);
    expect(result.nextIds).toEqual(["path-light"]);
  });
});

describe("mergeLevelUpTraits", () => {
  it("appends new trait ids without duplicating existing ones", () => {
    const result = mergeLevelUpTraits(
      ["trait-a", "trait-b"],
      {},
      [trait("trait-b"), trait("trait-c")]
    );

    expect(result.traits).toEqual(["trait-a", "trait-b", "trait-c"]);
  });

  it("keeps existing ids when the level grants no traits", () => {
    const result = mergeLevelUpTraits(["trait-a"], { "trait-a": { uses: "1" } }, []);

    expect(result.traits).toEqual(["trait-a"]);
    expect(result.traits_data).toEqual({ "trait-a": { uses: "1" } });
  });

  it("skips traits without id", () => {
    const result = mergeLevelUpTraits(
      [],
      {},
      [{ ...trait(""), id: "" }, trait("trait-c")]
    );

    expect(result.traits).toEqual(["trait-c"]);
  });

  it("merges traits_data with the new level overwriting colliding keys", () => {
    const result = mergeLevelUpTraits(
      ["trait-a"],
      { "trait-a": { uses: "1" }, "trait-b": { uses: "2" } },
      [trait("trait-c")],
      { "trait-a": { uses: "3" }, "trait-c": { uses: "1" } }
    );

    expect(result.traits).toEqual(["trait-a", "trait-c"]);
    expect(result.traits_data).toEqual({
      "trait-a": { uses: "3" },
      "trait-b": { uses: "2" },
      "trait-c": { uses: "1" },
    });
  });

  it("keeps stored tokens when the level only changes another one", () => {
    const result = mergeLevelUpTraits(
      ["breath"],
      { breath: { "{dice}": "2d6", "{area}": "cono" } },
      [],
      { breath: { "{dice}": "3d6" } }
    );

    expect(result.traits_data).toEqual({ breath: { "{dice}": "3d6", "{area}": "cono" } });
  });

  it("treats missing traits_data as empty objects", () => {
    const result = mergeLevelUpTraits(["trait-a"], undefined, [trait("trait-b")]);

    expect(result.traits).toEqual(["trait-a", "trait-b"]);
    expect(result.traits_data).toEqual({});
  });
});

describe("mergeClassAndRaceLevelUp", () => {
  it("appends race traits and lets race trait data overwrite the class row", () => {
    const result = mergeClassAndRaceLevelUp(
      [trait("class-trait")],
      { "class-trait": { "{dice}": "1d8" } },
      [trait("breath")],
      { breath: { "{dice}": "3d6" }, "class-trait": { "{dice}": "2d8" } }
    );

    expect(result.traits.map(item => item.id)).toEqual(["class-trait", "breath"]);
    expect(result.traits_data).toEqual({
      "class-trait": { "{dice}": "2d8" },
      breath: { "{dice}": "3d6" }
    });
  });

  it("keeps class tokens that the race does not define", () => {
    const result = mergeClassAndRaceLevelUp(
      [trait("breath")],
      { breath: { "{dice}": "2d6", "{area}": "cono" } },
      [],
      { breath: { "{dice}": "3d6" } }
    );

    expect(result.traits_data).toEqual({ breath: { "{dice}": "3d6", "{area}": "cono" } });
  });

  it("does not duplicate a trait granted by both class and race", () => {
    const result = mergeClassAndRaceLevelUp(
      [trait("breath")],
      {},
      [trait("breath")],
      { breath: { "{dice}": "3d6" } }
    );

    expect(result.traits).toHaveLength(1);
    expect(result.traits_data).toEqual({ breath: { "{dice}": "3d6" } });
  });
});

describe("mergeRaceLevelRows", () => {
  it("keeps parent tokens and lets the child overwrite the same key", () => {
    const result = mergeRaceLevelRows(
      {
        level: 6,
        traits_data: { breath: { "{dice}": "3d6", "{area}": "cono" } }
      },
      {
        level: 6,
        traits_data: { breath: { "{dice}": "4d6" } }
      }
    );

    expect(result).toEqual({
      level: 6,
      traits_data: { breath: { "{dice}": "4d6", "{area}": "cono" } }
    });
  });

  it("returns the only side that defines the level", () => {
    const parent = { level: 6, traits_data: { breath: { "{dice}": "3d6" } } };
    expect(mergeRaceLevelRows(parent, undefined)).toEqual(parent);
    expect(mergeRaceLevelRows(undefined, parent)).toEqual(parent);
  });
});

describe("traitIdsWithChangedData", () => {
  it("includes a trait when the previous level has no data for it", () => {
    expect(traitIdsWithChangedData(
      { breath: { "{dice}": "2d6" } },
      undefined
    )).toEqual(["breath"]);
  });

  it("includes a trait when a token value changes", () => {
    expect(traitIdsWithChangedData(
      { breath: { "{dice}": "3d6", "{area}": "cono" }, wings: { "{speed}": "30" } },
      { breath: { "{dice}": "2d6", "{area}": "cono" }, wings: { "{speed}": "30" } }
    )).toEqual(["breath"]);
  });

  it("skips traits whose tokens are unchanged", () => {
    expect(traitIdsWithChangedData(
      { breath: { "{dice}": "2d6" } },
      { breath: { "{dice}": "2d6", "{area}": "cono" } }
    )).toEqual([]);
  });
});

describe("levelUpTraitIds", () => {
  it("keeps the level order and appends changed ids that are missing", () => {
    expect(levelUpTraitIds(
      [trait("class-trait"), trait("breath")],
      ["breath", "wings"]
    )).toEqual(["class-trait", "breath", "wings"]);
  });
});

describe("orderTraitsByIds", () => {
  it("returns traits in the given id order and skips ids that were not loaded", () => {
    const result = orderTraitsByIds(
      [trait("wings"), trait("class-trait"), trait("breath")],
      ["class-trait", "breath", "missing", "wings"]
    );

    expect(result.map(item => item.id)).toEqual(["class-trait", "breath", "wings"]);
  });
});

const fire: Damage = {
  id: "fire",
  name: "Fuego",
  description: "",
  color: "#f00",
  ruleset: "dnd5e"
};

const dexterity = {
  id: "dex-id",
  name: "Destreza",
  key: "dex",
  ruleset: "dnd5e"
};

const constitution: CharacterAttributeApi = {
  id: "con-id",
  name: "Constitución",
  key: "con",
  value: 16,
  modifier: 3
};

const orc: RaceRef = {
  id: "orc-id",
  name: "Orcos",
  ruleset: "dnd5e",
  creatureTypeId: "humanoid-id"
};

describe("closeLevelUpTraitText", () => {
  const lineage = trait("draconic-ancestry", {
    damageChoices: [{
      key: "ancestor",
      choose: 1,
      options: [{
        name: "Rojo",
        damageTypeId: "fire",
        damage: fire,
        area: { shape: "cone", length: 4.5, unit: "m" },
        saveAttribute: dexterity
      }]
    }]
  });

  const breath = trait("draconic-breath", {
    description: ["Infliges 2d6 de daño de {damage} en {area}. Salvación de {save} CD {dc}."],
    summary: ["CD {dc}"],
    damageChoiceRef: { traitId: "draconic-ancestry", choiceKey: "ancestor" },
    action: {
      activation: "action",
      saveDcFormula: "8 + @attributes.con.modifier + @proficiencyBonus",
      uses: 1,
      recharge: "shortOrLongRest"
    }
  });

  const favored = trait("favored-enemy", {
    description: ["Tus enemigos predilectos son {name}."],
    summary: ["{name}"],
    catalogChoices: [{
      key: "enemy",
      options: [{
        name: "humanoid-id",
        creatureTypeId: "humanoid-id",
        races: 1,
        label: "{0}",
        creatureType: { id: "humanoid-id", name: "Humanoide", ruleset: "dnd5e" }
      }],
      grants: [{ atLevel: 1, choose: 1 }]
    }]
  });

  it("closes saved choices and {dc}, and resolves a damage choice whose source is not returned", () => {
    expect(damageChoiceSourceIdsToLoad([breath, favored])).toEqual(["draconic-ancestry"]);

    const result = closeLevelUpTraitText(
      [breath, favored],
      [lineage],
      {
        "draconic-ancestry": { ancestor: ["Rojo"] },
        "favored-enemy": { enemy: [{ name: "humanoid-id", raceIds: ["orc-id"] }] }
      },
      new Map([[orc.id, orc]]),
      [constitution],
      2
    );

    expect(result.map(item => item.id)).toEqual(["draconic-breath", "favored-enemy"]);
    expect(result[0].description).toEqual([
      "Infliges 2d6 de daño de Fuego en cono de 4,5 m. Salvación de Destreza CD 13."
    ]);
    expect(result[0].summary).toEqual(["CD 13"]);
    expect(result[0].action?.saveDc).toBe(13);
    expect(result[1].description).toEqual(["Tus enemigos predilectos son Orcos."]);
    expect(result[1].summary).toEqual(["Orcos"]);
  });
});
