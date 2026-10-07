import { describe, it, expect, vi, beforeEach } from "vitest";
import GetSystemsByUser from "./getSystemsByUser.use-case";
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
    description: "",
    publisher: "user-1",
    isOpen: true,
    isBase: true,
    kind: "ruleset",
    parentIds: [],
    ...overrides,
  };
}

describe("GetSystemsByUser", () => {
  const parent = makeSystem("parent", { name: "SRD", publisher: "user-1" });
  const child = makeSystem("child", {
    name: "Homebrew",
    publisher: "user-2",
    isBase: false,
    parentIds: [asId("parent")],
  });

  const systemService = {
    getByUserId: vi.fn(),
    getAncestorGraph: vi.fn(),
  };
  const userRepository = {
    getUserById: vi.fn(),
    getUsers: vi.fn(),
  };
  const raceRepository = {
    countRootRacesByRulesets: vi.fn(),
  };

  let useCase: GetSystemsByUser;

  beforeEach(() => {
    vi.clearAllMocks();
    userRepository.getUserById.mockResolvedValue({ accessibleSystems: ["child"] });
    systemService.getByUserId.mockResolvedValue([parent, child]);
    systemService.getAncestorGraph.mockResolvedValue(
      new Map([
        ["parent", parent],
        ["child", child],
      ])
    );
    userRepository.getUsers.mockResolvedValue([
      { id: "user-1", name: "Alice" },
      { id: "user-2", name: "Bob" },
    ]);
    raceRepository.countRootRacesByRulesets.mockResolvedValue(
      new Map([
        ["parent", 2],
        ["SRD", 1],
        ["child", 4],
      ])
    );
    useCase = new GetSystemsByUser(
      systemService as unknown as SystemService,
      userRepository as unknown as IUserRepository,
      raceRepository as unknown as IRaceRepository
    );
  });

  it("returns SystemSummary with batched publishers, ancestry and race counts", async () => {
    const result = await useCase.execute("user-1");

    expect(systemService.getByUserId).toHaveBeenCalledWith("user-1", ["child"], undefined);
    expect(userRepository.getUsers).toHaveBeenCalledTimes(1);
    expect(systemService.getAncestorGraph).toHaveBeenCalledTimes(1);
    expect(raceRepository.countRootRacesByRulesets).toHaveBeenCalledTimes(1);
    expect(raceRepository.countRootRacesByRulesets).toHaveBeenCalledWith(
      expect.arrayContaining(["parent", "SRD", "child", "Homebrew"])
    );

    expect(result).toEqual([
      {
        id: "parent",
        name: "SRD",
        description: "",
        publisher: "Alice",
        isOpen: true,
        isBase: true,
        kind: "ruleset",
        parentIds: [],
        canEdit: true,
        racesCount: 3,
        deletedAt: null,
      },
      {
        id: "child",
        name: "Homebrew",
        description: "",
        publisher: "Bob",
        isOpen: true,
        isBase: false,
        kind: "ruleset",
        parentIds: ["parent"],
        canEdit: false,
        racesCount: 7,
        deletedAt: null,
      },
    ]);
  });

  it("returns an empty list without counting races", async () => {
    systemService.getByUserId.mockResolvedValue([]);

    const result = await useCase.execute("user-1", "ruleset");

    expect(result).toEqual([]);
    expect(userRepository.getUsers).not.toHaveBeenCalled();
    expect(systemService.getAncestorGraph).not.toHaveBeenCalled();
    expect(raceRepository.countRootRacesByRulesets).not.toHaveBeenCalled();
  });
});
