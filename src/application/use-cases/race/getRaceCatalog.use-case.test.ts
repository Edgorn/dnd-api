import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import GetRaceCatalogUseCase from "./getRaceCatalog.use-case";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceCatalogItem } from "../../../domain/types/race.types";
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
  parentIds: [parentId]
};

const catalog: RaceCatalogItem[] = [
  { id: "elf1", name: "Elf", creatureTypeId: "humanoid", ruleset: parentId.toString() },
  { id: "high-elf", name: "High Elf", creatureTypeId: "humanoid", ruleset: parentId.toString() }
];

describe("GetRaceCatalogUseCase", () => {
  it("returns a flat catalog without overlays when no ruleset is provided", async () => {
    const raceService = {
      getCatalog: vi.fn().mockResolvedValue(catalog)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn()
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceCatalogUseCase(raceService, systemService, entityOverrideService);
    const result = await useCase.execute(undefined, true);

    expect(raceService.getCatalog).toHaveBeenCalledWith(undefined, true);
    expect(result).toEqual(catalog);
    expect(entityOverrideService.getBySystems).not.toHaveBeenCalled();
  });

  it("applies name overlays on the flat catalog", async () => {
    const overlay: EntityOverrideApi = {
      id: "ov-1",
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { name: "Elfo" }
    };
    const raceService = {
      getCatalog: vi.fn().mockResolvedValue(catalog)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn().mockResolvedValue([overlay])
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceCatalogUseCase(raceService, systemService, entityOverrideService);
    const result = await useCase.execute(childId.toString(), true);

    expect(result).toEqual([
      { id: "elf1", name: "Elfo", creatureTypeId: "humanoid", ruleset: parentId.toString() },
      { id: "high-elf", name: "High Elf", creatureTypeId: "humanoid", ruleset: parentId.toString() }
    ]);
  });
});
