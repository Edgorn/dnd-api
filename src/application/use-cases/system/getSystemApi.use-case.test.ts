import { describe, it, expect, vi, beforeEach } from "vitest";
import GetSystemApi from "./getSystemApi.use-case";
import SystemService from "../../../domain/services/system.service";
import UserService from "../../../domain/services/user.service";
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
    publisher: "owner-1",
    isOpen: true,
    isBase: true,
    kind: "ruleset",
    parentIds: [],
    ...overrides,
  };
}

describe("GetSystemApi", () => {
  const parent = makeSystem("parent", {
    name: "SRD",
    hpInitialFormula: "max(@class.hitDie) + @attributes.con.modifier",
    baseAcFormula: "10 + @attributes.dex.modifier",
  });
  const child = makeSystem("child", {
    name: "Homebrew",
    parentIds: [asId("parent")],
    isBase: false,
    hpInitialFormula: "12 + @attributes.con.modifier",
  });

  const systemService = {
    getById: vi.fn(),
    getAncestry: vi.fn(),
  };
  const userService = { getUserById: vi.fn() };
  const raceRepository = {
    obtenerPorSistema: vi.fn(),
    countRootRacesByRulesets: vi.fn(),
  };

  let useCase: GetSystemApi;

  beforeEach(() => {
    vi.clearAllMocks();
    systemService.getAncestry.mockResolvedValue([child, parent]);
    userService.getUserById.mockResolvedValue({ name: "Alice" });
    raceRepository.countRootRacesByRulesets.mockResolvedValue(
      new Map([
        ["parent", 2],
        ["SRD", 1],
        ["child", 4],
      ])
    );

    useCase = new GetSystemApi(
      systemService as unknown as SystemService,
      userService as unknown as UserService,
      raceRepository as unknown as IRaceRepository
    );
  });

  it("counts root races from ancestry without hydrating races", async () => {
    const result = await useCase.execute(child, "owner-1");

    expect(raceRepository.obtenerPorSistema).not.toHaveBeenCalled();
    expect(raceRepository.countRootRacesByRulesets).toHaveBeenCalledTimes(1);
    expect(raceRepository.countRootRacesByRulesets).toHaveBeenCalledWith(
      expect.arrayContaining(["parent", "SRD", "child", "Homebrew"])
    );
    expect(result.racesCount).toBe(7);
  });

  it("merges rules from ancestry without embedding catalogs", async () => {
    const result = await useCase.execute(child, "owner-1");

    expect(result.hpInitialFormula).toBe("12 + @attributes.con.modifier");
    expect(result.baseAcFormula).toBe("10 + @attributes.dex.modifier");
    expect(result).not.toHaveProperty("attributes");
    expect(result).not.toHaveProperty("skills");
    expect(result).not.toHaveProperty("coins");
    expect(systemService.getAncestry).toHaveBeenCalledTimes(1);
  });
});
