import { describe, it, expect, vi } from "vitest";
import GetOptionGroupsBySystems from "./getOptionGroupsBySystems.use-case";
import OptionGroupService from "../../../domain/services/optionGroup.service";
import SystemService from "../../../domain/services/system.service";
import { System } from "../../../domain/types/system.types";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

function makeSystem(id: string, name: string, parentIds: string[] = []): System {
  return {
    _id: asId(id),
    name,
    description: "",
    publisher: "owner-1",
    isOpen: true,
    isBase: parentIds.length === 0,
    kind: "ruleset",
    parentIds: parentIds.map(asId)
  };
}

describe("GetOptionGroupsBySystems", () => {
  it("does not collapse when no ruleset is provided", async () => {
    const optionGroupService = {
      getBySystems: vi.fn().mockResolvedValue([
        { id: "g1", name: "Invocaciones", ruleset: "sys-1", description: [], deletedAt: null }
      ])
    };
    const systemService = { getAncestry: vi.fn() };
    const useCase = new GetOptionGroupsBySystems(
      optionGroupService as unknown as OptionGroupService,
      systemService as unknown as SystemService
    );

    const result = await useCase.execute();

    expect(systemService.getAncestry).not.toHaveBeenCalled();
    expect(optionGroupService.getBySystems).toHaveBeenCalledWith([]);
    expect(result).toEqual([{ id: "g1", name: "Invocaciones", ruleset: "sys-1", description: [] }]);
  });

  it("collapses inherited groups by name with the child winning", async () => {
    const parent = makeSystem("parent", "SRD");
    const child = makeSystem("child", "Homebrew", ["parent"]);
    const optionGroupService = {
      getBySystems: vi.fn().mockResolvedValue([
        { id: "p1", name: "Invocaciones", ruleset: "parent", description: ["padre"], deletedAt: null },
        { id: "c1", name: "Invocaciones", ruleset: "child", description: ["hijo"], deletedAt: null }
      ])
    };
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([child, parent])
    };
    const useCase = new GetOptionGroupsBySystems(
      optionGroupService as unknown as OptionGroupService,
      systemService as unknown as SystemService
    );

    const result = await useCase.execute(["child"]);

    expect(result).toEqual([
      { id: "c1", name: "Invocaciones", ruleset: "child", description: ["hijo"] }
    ]);
  });
});
