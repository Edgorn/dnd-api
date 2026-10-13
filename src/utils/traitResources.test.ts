import { describe, expect, it } from "vitest";
import { normalizeActiveTraitIds, normalizeTraitResources } from "./traitResources";

describe("normalizeTraitResources", () => {
  it("returns an empty array for missing or invalid values", () => {
    expect(normalizeTraitResources(undefined)).toEqual([]);
    expect(normalizeTraitResources(null)).toEqual([]);
    expect(normalizeTraitResources({ traitId: "a", spent: 1 })).toEqual([]);
  });

  it("keeps valid rows and drops the rest", () => {
    expect(normalizeTraitResources([
      { traitId: "furia", spent: 1 },
      { traitId: "", spent: 1 },
      { traitId: "aliento", spent: -1 },
      { traitId: "aliento", spent: 1.5 },
      { spent: 2 }
    ])).toEqual([{ traitId: "furia", spent: 1 }]);
  });
});

describe("normalizeActiveTraitIds", () => {
  it("returns an empty array for missing values", () => {
    expect(normalizeActiveTraitIds(undefined)).toEqual([]);
  });

  it("deduplicates and drops empty ids", () => {
    expect(normalizeActiveTraitIds(["furia", "", "furia", "aliento"])).toEqual([
      "furia",
      "aliento"
    ]);
  });
});
