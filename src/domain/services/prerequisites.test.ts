import { describe, it, expect } from "vitest";
import { evaluatePrerequisites } from "./prerequisites";
import { PrerequisiteContext } from "../types/prerequisite.types";

function context(overrides: Partial<PrerequisiteContext> = {}): PrerequisiteContext {
  return {
    grantingClassId: "warlock",
    classLevels: { warlock: 5, fighter: 2 },
    characterLevel: 7,
    traitIds: ["pact-tome"],
    spellIds: ["eldritch-blast"],
    attributes: [{ key: "cha", value: 16 }, { key: "str", value: 8 }],
    ...overrides
  };
}

describe("evaluatePrerequisites", () => {
  it("returns true when there is no prerequisite", () => {
    expect(evaluatePrerequisites(undefined, context())).toBe(true);
    expect(evaluatePrerequisites(null, context())).toBe(true);
  });

  it("evaluates classLevel against the granting class when classId is omitted", () => {
    expect(evaluatePrerequisites({ type: "classLevel", min: 5 }, context())).toBe(true);
    expect(evaluatePrerequisites({ type: "classLevel", min: 6 }, context())).toBe(false);
  });

  it("evaluates classLevel against an explicit class", () => {
    expect(evaluatePrerequisites({ type: "classLevel", classId: "fighter", min: 2 }, context())).toBe(true);
    expect(evaluatePrerequisites({ type: "classLevel", classId: "fighter", min: 3 }, context())).toBe(false);
  });

  it("evaluates characterLevel, trait, spell and attribute", () => {
    expect(evaluatePrerequisites({ type: "characterLevel", min: 7 }, context())).toBe(true);
    expect(evaluatePrerequisites({ type: "characterLevel", min: 8 }, context())).toBe(false);
    expect(evaluatePrerequisites({ type: "trait", traitId: "pact-tome" }, context())).toBe(true);
    expect(evaluatePrerequisites({ type: "trait", traitId: "pact-blade" }, context())).toBe(false);
    expect(evaluatePrerequisites({ type: "spell", spellId: "eldritch-blast" }, context())).toBe(true);
    expect(evaluatePrerequisites({ type: "attribute", key: "cha", min: 13 }, context())).toBe(true);
    expect(evaluatePrerequisites({ type: "attribute", key: "str", min: 13 }, context())).toBe(false);
  });

  it("evaluates all and any combinations", () => {
    expect(evaluatePrerequisites({
      all: [
        { type: "trait", traitId: "pact-tome" },
        { type: "classLevel", min: 5 }
      ]
    }, context())).toBe(true);

    expect(evaluatePrerequisites({
      all: [
        { type: "trait", traitId: "pact-blade" },
        { type: "classLevel", min: 5 }
      ]
    }, context())).toBe(false);

    expect(evaluatePrerequisites({
      any: [
        { type: "trait", traitId: "pact-blade" },
        { type: "spell", spellId: "eldritch-blast" }
      ]
    }, context())).toBe(true);
  });
});
