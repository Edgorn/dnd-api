import { describe, expect, it, vi } from "vitest";
import CreateRaceUseCase from "./createRace.use-case";
import RaceService from "../../../domain/services/race.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreateRace, RaceApi } from "../../../domain/types/race.types";
import { CreatureTypeApi } from "../../../domain/types/creatureType.types";

const baseRace: CreateRace = {
  name: "Elfo",
  ruleset: "sys-child",
  speed: { walk: 30 },
  size: "Medium"
};

const savedRace = { id: "race-1", playable: true } as RaceApi;

const humanoid: CreatureTypeApi = {
  id: "type-1",
  name: "Humanoide",
  ruleset: "sys-parent",
  deletedAt: null
};

function buildUseCase(options?: {
  parent?: RaceApi | undefined;
  creatureType?: CreatureTypeApi | null;
  ancestors?: string[];
}) {
  const raceService = {
    crear: vi.fn().mockResolvedValue(savedRace),
    obtenerPorId: vi.fn().mockResolvedValue(options?.parent)
  } as unknown as RaceService;
  const creatureTypeService = {
    getById: vi.fn().mockResolvedValue(options?.creatureType === undefined ? null : options.creatureType)
  } as unknown as CreatureTypeService;
  const systemService = {
    getSystemsAndAncestors: vi.fn().mockResolvedValue(options?.ancestors ?? ["sys-child", "sys-parent"])
  } as unknown as SystemService;

  return {
    useCase: new CreateRaceUseCase(raceService, creatureTypeService, systemService),
    raceService,
    creatureTypeService
  };
}

describe("CreateRaceUseCase", () => {
  it("stores playable true when the flag is omitted", async () => {
    const { useCase, raceService } = buildUseCase();

    await useCase.execute(baseRace);

    expect(raceService.crear).toHaveBeenCalledWith({ ...baseRace, playable: true });
  });

  it("accepts a creature type that belongs to an ancestor ruleset", async () => {
    const { useCase, raceService } = buildUseCase({ creatureType: humanoid });

    await useCase.execute({ ...baseRace, creatureTypeId: humanoid.id, playable: false });

    expect(raceService.crear).toHaveBeenCalledWith({
      ...baseRace,
      creatureTypeId: humanoid.id,
      playable: false
    });
  });

  it("rejects a deleted creature type", async () => {
    const { useCase } = buildUseCase({
      creatureType: { ...humanoid, deletedAt: new Date("2026-01-01") }
    });

    await expect(useCase.execute({ ...baseRace, creatureTypeId: humanoid.id })).rejects.toMatchObject({
      statusCode: 404
    } satisfies Partial<AppError>);
  });

  it("rejects a creature type outside the race ruleset ancestry", async () => {
    const { useCase } = buildUseCase({
      creatureType: { ...humanoid, ruleset: "other-system" },
      ancestors: ["sys-child"]
    });

    await expect(useCase.execute({ ...baseRace, creatureTypeId: humanoid.id })).rejects.toMatchObject({
      statusCode: 400
    } satisfies Partial<AppError>);
  });

  it("rejects a playable subrace whose parent is not playable", async () => {
    const { useCase, raceService } = buildUseCase({
      parent: { ...savedRace, playable: false }
    });

    await expect(useCase.execute({ ...baseRace, parentId: "parent-1" })).rejects.toMatchObject({
      statusCode: 400
    } satisfies Partial<AppError>);
    expect(raceService.crear).not.toHaveBeenCalled();
  });
});
