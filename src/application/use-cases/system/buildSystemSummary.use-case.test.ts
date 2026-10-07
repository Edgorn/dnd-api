import { describe, it, expect, vi, beforeEach } from "vitest";
import BuildSystemSummary from "./buildSystemSummary.use-case";
import SystemService from "../../../domain/services/system.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import IRaceRepository from "../../../domain/repositories/IRaceRepository";
import { System } from "../../../domain/types/system.types";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

function makeSystem(id: string, overrides: Partial<System> = {}): System {
  return {
    _id: asId(id),
    name: id,
    description: "desc",
    publisher: "user-1",
    isOpen: false,
    isBase: true,
    kind: "ruleset",
    parentIds: [],
    ...overrides,
  };
}

describe("BuildSystemSummary", () => {
  it("maps publisher name, canEdit and inherited racesCount", async () => {
    const parent = makeSystem("parent", { name: "SRD" });
    const child = makeSystem("child", {
      name: "Homebrew",
      isBase: false,
      parentIds: [asId("parent")],
    });
    const systemService = {
      getAncestorGraph: vi.fn().mockResolvedValue(
        new Map([
          ["parent", parent],
          ["child", child],
        ])
      ),
    } as unknown as SystemService;
    const userRepository = {
      getUsers: vi.fn().mockResolvedValue([{ id: "user-1", name: "Alice" }]),
    } as unknown as IUserRepository;
    const raceRepository = {
      countRootRacesByRulesets: vi.fn().mockResolvedValue(
        new Map([
          ["parent", 2],
          ["child", 1],
        ])
      ),
    } as unknown as IRaceRepository;

    const useCase = new BuildSystemSummary(systemService, userRepository, raceRepository);
    const result = await useCase.execute(child, "user-1");

    expect(systemService.getAncestorGraph).toHaveBeenCalledWith([child]);
    expect(result).toMatchObject({
      id: "child",
      publisher: "Alice",
      canEdit: true,
      racesCount: 3,
      deletedAt: null,
    });
  });
});
