import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import DeleteRaceOverride from "./deleteRaceOverride.use-case";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { AppError } from "../../../domain/errors/AppError";
import { RaceApi } from "../../../domain/types/race.types";
import { System } from "../../../domain/types/system.types";

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

describe("DeleteRaceOverride UseCase", () => {
  it("soft-deletes the overlay when the publisher requests it", async () => {
    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(parentRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      softDelete: vi.fn().mockResolvedValue(true)
    } as unknown as EntityOverrideService;

    const useCase = new DeleteRaceOverride(raceService, systemService, entityOverrideService);
    await useCase.execute("elf1", childId.toString(), "user-1");

    expect(entityOverrideService.softDelete).toHaveBeenCalledWith(
      childId.toString(),
      "race",
      "elf1"
    );
  });

  it("throws 404 when the overlay does not exist", async () => {
    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(parentRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      softDelete: vi.fn().mockResolvedValue(false)
    } as unknown as EntityOverrideService;

    const useCase = new DeleteRaceOverride(raceService, systemService, entityOverrideService);

    await expect(useCase.execute("elf1", childId.toString(), "user-1")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 404
    );
  });

  it("throws 403 when the user is not the child system publisher", async () => {
    const raceService = {
      obtenerPorId: vi.fn()
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      softDelete: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new DeleteRaceOverride(raceService, systemService, entityOverrideService);

    await expect(useCase.execute("elf1", childId.toString(), "other-user")).rejects.toSatisfy(
      (error: unknown) => error instanceof AppError && error.statusCode === 403
    );
    expect(entityOverrideService.softDelete).not.toHaveBeenCalled();
  });
});
