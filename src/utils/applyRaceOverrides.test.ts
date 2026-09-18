import { describe, expect, it } from "vitest";
import { RaceApi } from "../domain/types/race.types";
import { EntityOverrideApi } from "../domain/types/entityOverride.types";
import {
  applyRaceOverrides,
  mergeFlavorPatch
} from "./applyRaceOverrides";

function makeRace(partial: Partial<RaceApi> & Pick<RaceApi, "id" | "name" | "ruleset">): RaceApi {
  return {
    description: ["Parent description"],
    img: "elf.png",
    alignment: "Neutral",
    speed: { walk: 30 },
    size: "Medium",
    ability_bonuses: [],
    traits: [],
    traits_data: {},
    languages: { understands: [], speaks: [], notes: "" },
    variants: [],
    ...partial
  };
}

describe("mergeFlavorPatch", () => {
  it("sets provided fields and removes keys set to null", () => {
    const merged = mergeFlavorPatch(
      { name: "Elf", img: "old.png", alignment: "Chaotic" },
      { description: ["Child text"], img: null }
    );

    expect(merged).toEqual({
      name: "Elf",
      alignment: "Chaotic",
      description: ["Child text"]
    });
  });

  it("does not add description when it is undefined or an empty array", () => {
    expect(mergeFlavorPatch({ name: "Elf" }, { description: undefined })).toEqual({
      name: "Elf"
    });
    expect(mergeFlavorPatch({ name: "Elf" }, { description: [] })).toEqual({
      name: "Elf"
    });
  });
});

describe("applyRaceOverrides", () => {
  const parentSystem = { id: "sys-x", name: "X" };
  const childSystem = { id: "sys-y", name: "Y" };
  const grandchildSystem = { id: "sys-z", name: "Z" };
  const ancestryYZ = [childSystem, parentSystem];
  const ancestryZYX = [grandchildSystem, childSystem, parentSystem];

  const elf = makeRace({
    id: "elf1",
    name: "Elf",
    ruleset: "sys-x"
  });

  it("does not mutate parent flavor when there is no overlay", () => {
    const [result] = applyRaceOverrides([elf], [], ancestryYZ);

    expect(result.id).toBe("elf1");
    expect(result.description).toEqual(["Parent description"]);
    expect(result.inherited).toBe(true);
    expect(result.overriddenFields).toBeUndefined();
  });

  it("lets the child overlay win over the parent description", () => {
    const overlays: EntityOverrideApi[] = [
      {
        id: "ov-1",
        ruleset: "sys-y",
        entityType: "race",
        sourceId: "elf1",
        patch: { description: ["Child elves"] }
      }
    ];

    const [result] = applyRaceOverrides([elf], overlays, ancestryYZ);

    expect(result.id).toBe("elf1");
    expect(result.description).toEqual(["Child elves"]);
    expect(result.overriddenFields).toEqual(["description"]);
    expect(result.overrideRuleset).toBe("sys-y");
  });

  it("lets the grandchild overlay win over the child overlay", () => {
    const overlays: EntityOverrideApi[] = [
      {
        id: "ov-y",
        ruleset: "sys-y",
        entityType: "race",
        sourceId: "elf1",
        patch: { description: ["Child elves"], name: "Elves of Y" }
      },
      {
        id: "ov-z",
        ruleset: "sys-z",
        entityType: "race",
        sourceId: "elf1",
        patch: { description: ["Grandchild elves"] }
      }
    ];

    const [result] = applyRaceOverrides([elf], overlays, ancestryZYX);

    expect(result.description).toEqual(["Grandchild elves"]);
    expect(result.name).toBe("Elves of Y");
    expect(result.overriddenFields).toEqual(["name", "description"]);
    expect(result.overrideRuleset).toBe("sys-z");
  });

  it("ignores null patch values", () => {
    const overlays: EntityOverrideApi[] = [
      {
        id: "ov-1",
        ruleset: "sys-y",
        entityType: "race",
        sourceId: "elf1",
        patch: { description: undefined, img: undefined }
      }
    ];

    const [result] = applyRaceOverrides([elf], overlays, ancestryYZ);
    expect(result.description).toEqual(["Parent description"]);
    expect(result.overriddenFields).toBeUndefined();
  });

  it("keeps the parent description when the patch has an empty description array", () => {
    const overlays: EntityOverrideApi[] = [
      {
        id: "ov-1",
        ruleset: "sys-y",
        entityType: "race",
        sourceId: "elf1",
        patch: { name: "Elfos", description: [] }
      }
    ];

    const [result] = applyRaceOverrides([elf], overlays, ancestryYZ);
    expect(result.name).toBe("Elfos");
    expect(result.description).toEqual(["Parent description"]);
    expect(result.overriddenFields).toEqual(["name"]);
  });

  it("applies overlays to nested subraces", () => {
    const woodElf = makeRace({
      id: "elf-wood",
      name: "Wood Elf",
      ruleset: "sys-x",
      parentId: "elf1"
    });
    const parentWithSubrace = makeRace({
      id: "elf1",
      name: "Elf",
      ruleset: "sys-x",
      subraces: { name: "Subraces", list: [woodElf] }
    });
    const overlays: EntityOverrideApi[] = [
      {
        id: "ov-sub",
        ruleset: "sys-y",
        entityType: "race",
        sourceId: "elf-wood",
        patch: { description: ["Forest kin"] }
      }
    ];

    const [result] = applyRaceOverrides([parentWithSubrace], overlays, ancestryYZ);
    expect(result.subraces?.list[0].description).toEqual(["Forest kin"]);
    expect(result.subraces?.list[0].inherited).toBe(true);
    expect(result.subraces?.list[0].overriddenFields).toEqual(["description"]);
  });

  it("marks inherited true without overlay when viewing a child system", () => {
    const [result] = applyRaceOverrides([elf], [], ancestryYZ);
    expect(result.inherited).toBe(true);
  });

  it("does not mark a race as inherited when it belongs to the viewing system", () => {
    const localRace = makeRace({ id: "orc1", name: "Orc", ruleset: "sys-y" });
    const [result] = applyRaceOverrides([localRace], [], ancestryYZ);
    expect(result.inherited).toBe(false);
  });
});
