import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import GetRaceSummariesUseCase from "./getRaceSummaries.use-case";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { RaceSummaryDraft } from "../../../domain/types/race.types";
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

const longParagraph = `${"A".repeat(210)} extra`;

const draft: RaceSummaryDraft = {
  id: "elf1",
  name: "Elf",
  img: "elf.png",
  description: ["Parent text"],
  ruleset: parentId.toString(),
  playable: true,
  size: "Medium",
  speed: { walk: 30 },
  ability_bonus_choices: { choose: 2 },
  skill_choices: { choose: 1 },
  subraces: {
    name: "Subrazas",
    list: [{
      id: "high-elf",
      name: "High Elf",
      img: "high.png",
      description: [longParagraph],
      ruleset: parentId.toString(),
      playable: true,
      parentId: "elf1"
    }]
  }
};

describe("GetRaceSummariesUseCase", () => {
  it("returns teasers without applying overlays when no ruleset is provided", async () => {
    const raceService = {
      getSummaries: vi.fn().mockResolvedValue([draft])
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn()
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceSummariesUseCase(raceService, systemService, entityOverrideService);
    const [result] = await useCase.execute();

    expect(raceService.getSummaries).toHaveBeenCalledWith(undefined, undefined);
    expect(entityOverrideService.getBySystems).not.toHaveBeenCalled();
    expect(result.descriptionTeaser).toBe("Parent text");
    expect(result).not.toHaveProperty("description");
    expect(result.subraces?.list[0].descriptionTeaser).toBe(`${"A".repeat(200)}…`);
    expect(result.ability_bonus_choices).toEqual({ choose: 2 });
    expect(result.skill_choices).toEqual({ choose: 1 });
  });

  it("builds the teaser from the patched description", async () => {
    const overlay: EntityOverrideApi = {
      id: "ov-1",
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { description: ["Child elves live in the woods."] }
    };

    const raceService = {
      getSummaries: vi.fn().mockResolvedValue([draft])
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySystems: vi.fn().mockResolvedValue([overlay])
    } as unknown as EntityOverrideService;

    const useCase = new GetRaceSummariesUseCase(raceService, systemService, entityOverrideService);
    const [result] = await useCase.execute(childId.toString(), true);

    expect(raceService.getSummaries).toHaveBeenCalledWith(childId.toString(), true);
    expect(result.descriptionTeaser).toBe("Child elves live in the woods.");
    expect(result.inherited).toBe(true);
    expect(result.overriddenFields).toEqual(["description"]);
  });
});
