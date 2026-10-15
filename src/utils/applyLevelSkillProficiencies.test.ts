import { describe, expect, it } from "vitest";
import {
  applyLevelSkillProficiencyPicks,
  pendingLevelSkillProficiencyChoices
} from "./applyLevelSkillProficiencies";

const proficientIds = ["skill-id-stealth", "skill-id-athletics", "skill-id-arcana"];

describe("applyLevelSkillProficiencyPicks", () => {
  const grants = [{ choose: 2, value: 2 as const, from: "proficient" as const }];

  it("lists pending options that are not yet overlayed", () => {
    expect(pendingLevelSkillProficiencyChoices({
      grants,
      proficientIds,
      overlays: [{ skillId: "skill-id-stealth", value: 2 }]
    })).toEqual([{
      add: 2,
      value: 2,
      optionIds: ["skill-id-athletics", "skill-id-arcana"]
    }]);
  });

  it("appends this level picks", () => {
    const result = applyLevelSkillProficiencyPicks({
      grants,
      proficientIds,
      overlays: [{ skillId: "skill-id-stealth", value: 2 }],
      picks: ["skill-id-athletics", "skill-id-arcana"]
    });
    expect(result).toEqual({
      overlays: [
        { skillId: "skill-id-stealth", value: 2 },
        { skillId: "skill-id-athletics", value: 2 },
        { skillId: "skill-id-arcana", value: 2 }
      ]
    });
  });

  it("rejects a skill that is not proficient or already overlayed", () => {
    expect(applyLevelSkillProficiencyPicks({
      grants,
      proficientIds,
      picks: ["missing", "skill-id-stealth"]
    })).toEqual({ error: "La skill missing no es una competencia del personaje" });

    expect(applyLevelSkillProficiencyPicks({
      grants,
      proficientIds,
      overlays: [{ skillId: "skill-id-stealth", value: 2 }],
      picks: ["skill-id-stealth", "skill-id-athletics"]
    })).toMatchObject({ error: expect.stringMatching(/bonificador/) });
  });

  it("rejects picks when the level has no grant", () => {
    expect(applyLevelSkillProficiencyPicks({
      grants: [],
      proficientIds,
      picks: ["skill-id-stealth"]
    })).toEqual({ error: "skillProficiencyPicks no aplica en esta subida" });
  });
});
