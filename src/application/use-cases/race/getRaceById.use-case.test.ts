import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import GetRaceByIdUseCase from "./getRaceById.use-case";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceApi, RaceSummaryDraft } from "../../../domain/types/race.types";
import { System } from "../../../domain/types/system.types";
import { EntityOverrideApi } from "../../../domain/types/entityOverride.types";
import { NotFoundError } from "../../../domain/errors/AppError";

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

const highElfDraft: RaceSummaryDraft = {
  id: "high-elf",
  name: "High Elf",
  img: "high.png",
  description: ["Forest kin of the isles."],
  ruleset: parentId.toString(),
  playable: true,
  parentId: "elf1"
};

describe("GetRaceByIdUseCase", () => {
  it("returns the canonical race with summary subraces when no ruleset is provided", async () => {
    const raceService = {
      getById: vi.fn().mockResolvedValue(parentRace),
      getSummarySubtree: vi.fn().mockResolvedValue({ name: "Linajes", list: [highElfDraft] })
    } as unknown as RaceService;
    const systemService = {
      getSystemsAndAncestors: vi.fn(),
      getAncestry: vi.fn()
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceByIdUseCase(raceService, systemService, entityOverrideService);
    const result = await useCase.execute("elf1");

    expect(raceService.getById).toHaveBeenCalledWith("elf1");
    expect(raceService.getSummarySubtree).toHaveBeenCalledWith("elf1");
    expect(systemService.getSystemsAndAncestors).not.toHaveBeenCalled();
    expect(result.traits).toEqual([]);
    expect(result.subraces?.name).toBe("Linajes");
    expect(result.subraces?.list[0]).toMatchObject({
      id: "high-elf",
      name: "High Elf",
      descriptionTeaser: "Forest kin of the isles."
    });
    expect(result.subraces?.list[0]).not.toHaveProperty("traits");
    expect(result.subraces?.list[0]).not.toHaveProperty("description");
  });

  it("applies overlays to the node and to summary subraces", async () => {
    const overlays: EntityOverrideApi[] = [
      {
        id: "ov-1",
        ruleset: childId.toString(),
        entityType: "race",
        sourceId: "elf1",
        patch: { name: "Elfo" }
      },
      {
        id: "ov-2",
        ruleset: childId.toString(),
        entityType: "race",
        sourceId: "high-elf",
        patch: { description: ["Child high elves."] }
      }
    ];
    const expanded = [childId.toString(), parentId.toString()];
    const raceService = {
      getById: vi.fn().mockResolvedValue(parentRace),
      getSummarySubtree: vi.fn().mockResolvedValue({ name: "Linajes", list: [highElfDraft] })
    } as unknown as RaceService;
    const systemService = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue(expanded),
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn().mockResolvedValue(overlays)
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceByIdUseCase(raceService, systemService, entityOverrideService);
    const result = await useCase.execute("elf1", childId.toString());

    expect(raceService.getById).toHaveBeenCalledWith("elf1", expanded);
    expect(raceService.getSummarySubtree).toHaveBeenCalledWith("elf1", childId.toString());
    expect(result.name).toBe("Elfo");
    expect(result.inherited).toBe(true);
    expect(result.overriddenFields).toEqual(["name"]);
    expect(result.subraces?.list[0].descriptionTeaser).toBe("Child high elves.");
    expect(result.subraces?.list[0].overriddenFields).toEqual(["description"]);
    expect(result.subraces?.list[0]).not.toHaveProperty("traits");
  });

  it("throws 404 when the race is outside the viewed ruleset ancestry", async () => {
    const raceService = {
      getById: vi.fn().mockResolvedValue({ ...parentRace, ruleset: "other-system" }),
      getSummarySubtree: vi.fn()
    } as unknown as RaceService;
    const systemService = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue([childId.toString(), parentId.toString()]),
      getAncestry: vi.fn()
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceByIdUseCase(raceService, systemService, entityOverrideService);

    await expect(useCase.execute("elf1", childId.toString())).rejects.toBeInstanceOf(NotFoundError);
    expect(entityOverrideService.getBySystems).not.toHaveBeenCalled();
    expect(raceService.getSummarySubtree).not.toHaveBeenCalled();
  });
});
