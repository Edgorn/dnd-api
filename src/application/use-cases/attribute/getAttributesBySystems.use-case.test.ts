import { describe, it, expect, vi } from "vitest";
import GetAttributesBySystems from "./getAttributesBySystems.use-case";
import AttributeService from "../../../domain/services/attribute.service";
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
    parentIds: parentIds.map(asId),
  };
}

describe("GetAttributesBySystems", () => {
  it("does not collapse when no ruleset is provided", async () => {
    const attributeService = {
      getBySystems: vi.fn().mockResolvedValue([
        { id: "a1", key: "str", ruleset: "sys-1", name: "Fuerza", deletedAt: null },
      ]),
    };
    const systemService = { getAncestry: vi.fn() };

    const useCase = new GetAttributesBySystems(
      attributeService as unknown as AttributeService,
      systemService as unknown as SystemService
    );

    const result = await useCase.execute();

    expect(systemService.getAncestry).not.toHaveBeenCalled();
    expect(attributeService.getBySystems).toHaveBeenCalledWith([]);
    expect(result).toEqual([{ id: "a1", key: "str", ruleset: "sys-1", name: "Fuerza" }]);
  });

  it("collapses inherited attributes by key with the child winning", async () => {
    const parent = makeSystem("parent", "SRD");
    const child = makeSystem("child", "Homebrew", ["parent"]);
    const attributeService = {
      getBySystems: vi.fn().mockResolvedValue([
        { id: "p-str", key: "str", ruleset: "parent", name: "Strength", deletedAt: null },
        { id: "c-str", key: "str", ruleset: "child", name: "Fuerza", deletedAt: null },
        { id: "p-dex", key: "dex", ruleset: "SRD", name: "Dexterity", deletedAt: null },
      ]),
    };
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([child, parent]),
    };

    const useCase = new GetAttributesBySystems(
      attributeService as unknown as AttributeService,
      systemService as unknown as SystemService
    );

    const result = await useCase.execute(["child"]);

    expect(systemService.getAncestry).toHaveBeenCalledWith("child");
    expect(attributeService.getBySystems).toHaveBeenCalledWith(
      ["child", "Homebrew", "parent", "SRD"],
      false
    );
    expect(result).toEqual([
      { id: "c-str", key: "str", ruleset: "child", name: "Fuerza" },
      { id: "p-dex", key: "dex", ruleset: "SRD", name: "Dexterity" },
    ]);
  });
});
