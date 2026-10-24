import { describe, it, expect } from "vitest";
import { meetsAttributeRequirements } from "./attributeRequirements";

const attributes = [
  { key: "str", value: 15 },
  { key: "dex", value: 14 },
  { key: "con", value: 13 }
];

describe("meetsAttributeRequirements", () => {
  it("passes when there are no attribute requirements", () => {
    expect(meetsAttributeRequirements(undefined, attributes)).toBe(true);
  });

  it("requires every attribute in all mode", () => {
    const requirements = {
      attributeMode: "all" as const,
      attributes: [
        { key: "str", min: 13 },
        { key: "con", min: 13 }
      ]
    };
    expect(meetsAttributeRequirements(requirements, attributes)).toBe(true);
    expect(meetsAttributeRequirements(requirements, [{ key: "str", value: 12 }, { key: "con", value: 13 }])).toBe(false);
  });

  it("requires any attribute in any mode", () => {
    const requirements = {
      attributeMode: "any" as const,
      attributes: [
        { key: "str", min: 20 },
        { key: "dex", min: 13 }
      ]
    };
    expect(meetsAttributeRequirements(requirements, attributes)).toBe(true);
    expect(meetsAttributeRequirements(requirements, [{ key: "str", value: 10 }, { key: "dex", value: 10 }])).toBe(false);
  });

  it("treats a missing attribute as 0", () => {
    expect(meetsAttributeRequirements(
      { attributes: [{ key: "int", min: 13 }] },
      [{ key: "str", value: 18 }]
    )).toBe(false);
  });
});
