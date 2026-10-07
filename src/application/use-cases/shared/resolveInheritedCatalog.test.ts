import { describe, it, expect } from "vitest";
import {
  ancestryRulesetKeys,
  loadResolvedCatalogs,
  resolveInheritedCatalog,
} from "./resolveInheritedCatalog";

function node(id: string, name?: string) {
  return { _id: { toString: () => id }, name };
}

describe("resolveInheritedCatalog", () => {
  const parent = node("parent", "SRD");
  const child = node("child", "Homebrew");
  const ancestry = [child, parent];

  it("lets the child override the parent on the same identity", () => {
    const items = [
      { id: "p-str", key: "str", ruleset: "parent" },
      { id: "c-str", key: "str", ruleset: "child" },
    ];

    const resolved = resolveInheritedCatalog(ancestry, items, {
      identityOf: (item) => item.key,
      rulesetOf: (item) => item.ruleset,
    });

    expect(resolved).toEqual([{ id: "c-str", key: "str", ruleset: "child" }]);
  });

  it("keeps distinct identities from parent and child", () => {
    const items = [
      { id: "p-str", key: "str", ruleset: "parent" },
      { id: "c-luck", key: "luck", ruleset: "child" },
    ];

    const resolved = resolveInheritedCatalog(ancestry, items, {
      identityOf: (item) => item.key,
      rulesetOf: (item) => item.ruleset,
    });

    expect(resolved).toEqual([
      { id: "p-str", key: "str", ruleset: "parent" },
      { id: "c-luck", key: "luck", ruleset: "child" },
    ]);
  });

  it("matches items whose ruleset is the ancestor name", () => {
    const items = [
      { id: "srd-str", key: "str", ruleset: "SRD" },
      { id: "hb-str", key: "str", ruleset: "Homebrew" },
    ];

    const resolved = resolveInheritedCatalog(ancestry, items, {
      identityOf: (item) => item.key,
      rulesetOf: (item) => item.ruleset,
    });

    expect(resolved).toEqual([{ id: "hb-str", key: "str", ruleset: "Homebrew" }]);
  });

  it("collects ancestry id and name keys", () => {
    expect(ancestryRulesetKeys(ancestry)).toEqual(["child", "Homebrew", "parent", "SRD"]);
  });
});

describe("loadResolvedCatalogs", () => {
  it("collapses each requested ruleset independently and concatenates", async () => {
    const parent = node("parent", "SRD");
    const child = node("child", "Homebrew");
    const other = node("other", "PF2");

    const getAncestry = async (id: string) => {
      if (id === "child") return [child, parent];
      if (id === "other") return [other];
      return [];
    };

    const items = [
      { id: "p-str", key: "str", ruleset: "parent" },
      { id: "c-str", key: "str", ruleset: "child" },
      { id: "o-str", key: "str", ruleset: "other" },
    ];

    const result = await loadResolvedCatalogs(
      ["child", "other"],
      getAncestry,
      async () => items,
      {
        identityOf: (item) => item.key,
        rulesetOf: (item) => item.ruleset,
      }
    );

    expect(result).toEqual([
      { id: "c-str", key: "str", ruleset: "child" },
      { id: "o-str", key: "str", ruleset: "other" },
    ]);
  });

  it("loads by the raw ruleset when ancestry is empty", async () => {
    const loaded: string[][] = [];
    const result = await loadResolvedCatalogs(
      ["unknown"],
      async () => [],
      async (keys) => {
        loaded.push(keys);
        return [{ id: "x", key: "str", ruleset: "unknown" }];
      },
      {
        identityOf: (item) => item.key,
        rulesetOf: (item) => item.ruleset,
      }
    );

    expect(loaded).toEqual([["unknown"]]);
    expect(result).toEqual([{ id: "x", key: "str", ruleset: "unknown" }]);
  });
});
