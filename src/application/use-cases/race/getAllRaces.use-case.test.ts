import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import GetAllRacesUseCase from "./getAllRaces.use-case";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceApi } from "../../../domain/types/race.types";
import { System } from "../../../domain/types/system.types";
import { EntityOverrideApi } from "../../../domain/types/entityOverride.types";

const parentId = new Types.ObjectId();
const childId = new Types.ObjectId();

const parentSystem: System = {
  _id: parentId,
  name: "X",
  description: "",
  publisher: "owner-x",
  isOpen: true,
  isBase: false
};

const childSystem: System = {
  _id: childId,
  name: "Y",
  description: "",
  publisher: "user-1",
  isOpen: false,
  isBase: false,
  parentId
};

const parentRace: RaceApi = {
  id: "elf1",
  name: "Elf",
  description: ["Parent text"],
  img: "elf.png",
  ruleset: parentId.toString(),
  speed: { walk: 30 },
  size: "Medium",
  ability_bonuses: [],
  traits: [],
  traits_data: {},
  languages: { understands: [], speaks: [], notes: "" },
  variants: [],
  playable: true
};

describe("GetAllRacesUseCase", () => {
  it("returns all races without overlays when no ruleset is provided", async () => {
    const raceService = {
      obtenerTodas: vi.fn().mockResolvedValue([parentRace]),
      obtenerPorSistema: vi.fn()
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn()
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new GetAllRacesUseCase(raceService, systemService, entityOverrideService);
    const result = await useCase.execute();

    expect(result).toEqual([parentRace]);
    expect(raceService.obtenerTodas).toHaveBeenCalledWith(undefined);
    expect(raceService.obtenerPorSistema).not.toHaveBeenCalled();
    expect(entityOverrideService.getBySystems).not.toHaveBeenCalled();
  });

  it("forwards the playable filter to the race listing", async () => {
    const raceService = {
      obtenerPorSistema: vi.fn().mockResolvedValue([parentRace])
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new GetAllRacesUseCase(raceService, systemService, entityOverrideService);
    await useCase.execute(childId.toString(), true);

    expect(raceService.obtenerPorSistema).toHaveBeenCalledWith(childId.toString(), true);
  });

  it("returns the parent race id with the child description", async () => {
    const overlay: EntityOverrideApi = {
      id: "ov-1",
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { description: ["Child elves"] }
    };

    const raceService = {
      obtenerPorSistema: vi.fn().mockResolvedValue([parentRace])
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn().mockResolvedValue([overlay])
    } as unknown as EntityOverrideService;

    const useCase = new GetAllRacesUseCase(raceService, systemService, entityOverrideService);
    const [result] = await useCase.execute(childId.toString());

    expect(result.id).toBe("elf1");
    expect(result.description).toEqual(["Child elves"]);
    expect(result.inherited).toBe(true);
    expect(result.overriddenFields).toEqual(["description"]);
    expect(result.overrideRuleset).toBe(childId.toString());
  });
});
