import { describe, it, expect } from "vitest";
import { mergeLevelUpTraits } from "./characterLevelUpTraits";
import { TraitApi } from "../domain/types/traits.types";

const trait = (id: string): TraitApi => ({
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

  it("treats missing traits_data as empty objects", () => {
    const result = mergeLevelUpTraits(["trait-a"], undefined, [trait("trait-b")]);

    expect(result.traits).toEqual(["trait-a", "trait-b"]);
    expect(result.traits_data).toEqual({});
  });
});
