import { describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";
import UpsertRaceOverride from "./upsertRaceOverride.use-case";
import RaceService from "../../../domain/services/race.service";
import SystemService from "../../../domain/services/system.service";
import EntityOverrideService from "../../../domain/services/entityOverride.service";
import { AppError } from "../../../domain/errors/AppError";
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
  variants: []
};

describe("UpsertRaceOverride UseCase", () => {
  it("upserts a flavor patch when the user publishes the child system", async () => {
    const saved: EntityOverrideApi = {
      id: "ov-1",
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { description: ["Child elves"] }
    };

    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(parentRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySource: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue(saved)
    } as unknown as EntityOverrideService;

    const useCase = new UpsertRaceOverride(raceService, systemService, entityOverrideService);
    const result = await useCase.execute(
      "elf1",
      { ruleset: childId.toString(), description: ["Child elves"] },
      "user-1"
    );

    expect(entityOverrideService.upsert).toHaveBeenCalledWith({
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { description: ["Child elves"] }
    });
    expect(result).toEqual(saved);
  });

  it("upserts only the provided name without persisting an empty description", async () => {
    const saved: EntityOverrideApi = {
      id: "ov-1",
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { name: "Elfos" }
    };

    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(parentRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySource: vi.fn().mockResolvedValue(null),
      upsert: vi.fn().mockResolvedValue(saved)
    } as unknown as EntityOverrideService;

    const useCase = new UpsertRaceOverride(raceService, systemService, entityOverrideService);
    await useCase.execute("elf1", { ruleset: childId.toString(), name: "Elfos" }, "user-1");

    expect(entityOverrideService.upsert).toHaveBeenCalledWith({
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { name: "Elfos" }
    });
  });

  it("restores a soft-deleted overlay on upsert", async () => {
    const existing: EntityOverrideApi = {
      id: "ov-1",
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { name: "Old" }
    };
    const saved: EntityOverrideApi = {
      ...existing,
      patch: { name: "Old", description: ["New"] }
    };

    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(parentRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      getBySource: vi.fn().mockResolvedValue(existing),
      upsert: vi.fn().mockResolvedValue(saved)
    } as unknown as EntityOverrideService;

    const useCase = new UpsertRaceOverride(raceService, systemService, entityOverrideService);
    await useCase.execute(
      "elf1",
      { ruleset: childId.toString(), description: ["New"] },
      "user-1"
    );

    expect(entityOverrideService.getBySource).toHaveBeenCalledWith(
      childId.toString(),
      "race",
      "elf1",
      true
    );
    expect(entityOverrideService.upsert).toHaveBeenCalledWith({
      ruleset: childId.toString(),
      entityType: "race",
      sourceId: "elf1",
      patch: { name: "Old", description: ["New"] }
    });
  });

  it("throws 403 when the user is not the child system publisher", async () => {
    const raceService = {
      obtenerPorId: vi.fn()
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      upsert: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new UpsertRaceOverride(raceService, systemService, entityOverrideService);

    await expect(
      useCase.execute("elf1", { ruleset: childId.toString(), description: ["X"] }, "other-user")
    ).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.statusCode === 403);
    expect(entityOverrideService.upsert).not.toHaveBeenCalled();
  });

  it("throws 400 when the race belongs to the child system", async () => {
    const ownRace = { ...parentRace, ruleset: childId.toString() };
    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(ownRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      upsert: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new UpsertRaceOverride(raceService, systemService, entityOverrideService);

    await expect(
      useCase.execute("elf1", { ruleset: childId.toString(), description: ["X"] }, "user-1")
    ).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.statusCode === 400);
  });

  it("throws 400 when the race is outside the child ancestry", async () => {
    const foreignRace = { ...parentRace, ruleset: new Types.ObjectId().toString() };
    const raceService = {
      obtenerPorId: vi.fn().mockResolvedValue(foreignRace)
    } as unknown as RaceService;
    const systemService = {
      getAncestry: vi.fn().mockResolvedValue([childSystem, parentSystem])
    } as unknown as SystemService;
    const entityOverrideService = {
      upsert: vi.fn()
    } as unknown as EntityOverrideService;

    const useCase = new UpsertRaceOverride(raceService, systemService, entityOverrideService);

    await expect(
      useCase.execute("elf1", { ruleset: childId.toString(), description: ["X"] }, "user-1")
    ).rejects.toSatisfy((error: unknown) => error instanceof AppError && error.statusCode === 400);
  });
});
