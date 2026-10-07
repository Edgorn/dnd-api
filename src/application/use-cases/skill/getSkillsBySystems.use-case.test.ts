import { describe, it, expect, vi } from "vitest";
import GetSkillsBySystems from "./getSkillsBySystems.use-case";
import SkillService from "../../../domain/services/skill.service";
import SystemService from "../../../domain/services/system.service";
import { System } from "../../../domain/types/system.types";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

function makeSystem(id: string, name: string): System {
  return {
    _id: asId(id),
    name,
    description: "",
    publisher: "owner-1",
    isOpen: true,
    isBase: true,
    kind: "ruleset",
    parentIds: [],
  };
}

describe("GetSkillsBySystems", () => {
  it("returns all skills without collapsing when no ruleset is provided", async () => {
    const skillService = {
      getAll: vi.fn().mockResolvedValue([
        { id: "s1", key: "ath", ruleset: "sys-1", name: "Athletics", attributeScore: ["str"], deletedAt: null },
      ]),
      getBySystems: vi.fn(),
    };
    const systemService = { getAncestry: vi.fn() };

    const useCase = new GetSkillsBySystems(
      skillService as unknown as SkillService,
      systemService as unknown as SystemService
    );

    const result = await useCase.execute();

    expect(skillService.getAll).toHaveBeenCalled();
    expect(skillService.getBySystems).not.toHaveBeenCalled();
    expect(systemService.getAncestry).not.toHaveBeenCalled();
    expect(result).toEqual([
      { id: "s1", key: "ath", ruleset: "sys-1", name: "Athletics", attributeScore: ["str"] },
    ]);
  });

  it("collapses inherited skills by key using active skills only", async () => {
    const parent = makeSystem("parent", "SRD");
    const child = makeSystem("child", "Homebrew");
    const skillService = {
      getAll: vi.fn(),
      getBySystems: vi.fn().mockResolvedValue([
        { id: "p-ath", key: "ath", ruleset: "parent", name: "Athletics", attributeScore: ["str"], deletedAt: null },
        { id: "c-ath", key: "ath", ruleset: "child", name: "Atletismo", attributeScore: ["str"], deletedAt: null },
      ]),
    };
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([child, parent]),
    };

    const useCase = new GetSkillsBySystems(
      skillService as unknown as SkillService,
      systemService as unknown as SystemService
    );

    const result = await useCase.execute(["child"]);

    expect(skillService.getBySystems).toHaveBeenCalledWith(
      ["child", "Homebrew", "parent", "SRD"],
      false,
      false
    );
    expect(result).toEqual([
      { id: "c-ath", key: "ath", ruleset: "child", name: "Atletismo", attributeScore: ["str"] },
    ]);
  });
});
