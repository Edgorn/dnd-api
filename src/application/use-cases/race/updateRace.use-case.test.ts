import { describe, expect, it, vi } from "vitest";
import UpdateRaceUseCase from "./updateRace.use-case";
import GetRaceByIdUseCase from "./getRaceById.use-case";
import RaceService from "../../../domain/services/race.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import { RaceApi, RaceDetailApi } from "../../../domain/types/race.types";

const existingRace = {
  id: "race-1",
  ruleset: "sys-child",
  parentId: "parent-1",
  playable: false
} as RaceApi;

const parentRace = {
  id: "parent-1",
  playable: false
} as RaceApi;

const updatedDetail = {
  id: "race-1",
  name: "Alto elfo",
  playable: false,
  subraces: { name: "Linajes", list: [] }
} as unknown as RaceDetailApi;

function buildUseCase() {
  const raceService = {
    getById: vi.fn().mockImplementation(async (id: string) => {
      if (id === existingRace.id) return existingRace;
      if (id === parentRace.id) return parentRace;
      return undefined;
    }),
    update: vi.fn().mockResolvedValue(existingRace)
  } as unknown as RaceService;
  const creatureTypeService = {
    getById: vi.fn()
  } as unknown as CreatureTypeService;
  const systemService = {
    getSystemsAndAncestors: vi.fn()
  } as unknown as SystemService;
  const getRaceById = {
    execute: vi.fn().mockResolvedValue(updatedDetail)
  } as unknown as GetRaceByIdUseCase;

  return {
    useCase: new UpdateRaceUseCase(raceService, creatureTypeService, systemService, getRaceById),
    raceService,
    getRaceById
  };
}

describe("UpdateRaceUseCase", () => {
  it("does not send playable or creatureTypeId when they are omitted", async () => {
    const { useCase, raceService } = buildUseCase();

    await useCase.execute({ id: existingRace.id, name: "Alto elfo" });

    expect(raceService.update).toHaveBeenCalledWith({ id: existingRace.id, name: "Alto elfo" });
  });

  it("rejects making a subrace playable when its parent is not", async () => {
    const { useCase, raceService } = buildUseCase();

    await expect(useCase.execute({ id: existingRace.id, playable: true })).rejects.toMatchObject({
      statusCode: 400
    });
    expect(raceService.update).not.toHaveBeenCalled();
  });

  it("returns undefined when the race does not exist", async () => {
    const { useCase, getRaceById } = buildUseCase();

    await expect(useCase.execute({ id: "missing", name: "Nada" })).resolves.toBeUndefined();
    expect(getRaceById.execute).not.toHaveBeenCalled();
  });

  it("returns the canonical RaceDetail for the updated id", async () => {
    const { useCase, getRaceById } = buildUseCase();

    await expect(useCase.execute({ id: existingRace.id, name: "Alto elfo" })).resolves.toBe(updatedDetail);
    expect(getRaceById.execute).toHaveBeenCalledWith(existingRace.id);
  });
});
