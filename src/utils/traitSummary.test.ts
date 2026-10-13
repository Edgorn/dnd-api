import { describe, expect, it } from "vitest";
import { displaySummary, storedSummary, summaryToPersist } from "./traitSummary";

describe("storedSummary", () => {
  it("returns a copy of the stored array", () => {
    const summary = ["corto"];
    expect(storedSummary(summary)).toEqual(["corto"]);
    expect(storedSummary(summary)).not.toBe(summary);
  });

  it("returns [] when summary is missing or empty", () => {
    expect(storedSummary(undefined)).toEqual([]);
    expect(storedSummary(null)).toEqual([]);
    expect(storedSummary([])).toEqual([]);
  });
});

describe("displaySummary", () => {
  it("prefers a non-empty summary", () => {
    expect(displaySummary(["corto"], ["largo"])).toEqual(["corto"]);
  });

  it("falls back to description when summary is empty", () => {
    expect(displaySummary([], ["largo"])).toEqual(["largo"]);
    expect(displaySummary(undefined, ["largo"])).toEqual(["largo"]);
  });

  it("returns [] when both are empty", () => {
    expect(displaySummary([], [])).toEqual([]);
  });
});

describe("summaryToPersist", () => {
  it("stores a distinct summary", () => {
    expect(summaryToPersist(["corto"], ["largo"])).toEqual(["corto"]);
  });

  it("clears a summary that duplicates description", () => {
    expect(summaryToPersist(["mismo"], ["mismo"])).toEqual([]);
    expect(summaryToPersist(["a", "b"], ["a", "b"])).toEqual([]);
  });

  it("keeps an empty summary", () => {
    expect(summaryToPersist([], ["largo"])).toEqual([]);
  });

  it("does not treat different order as equal", () => {
    expect(summaryToPersist(["a", "b"], ["b", "a"])).toEqual(["a", "b"]);
  });
});
