import { describe, it, expect, vi } from "vitest";
import CreateSystem from "./createSystem.use-case";
import UpdateSystem from "./updateSystem.use-case";
import SystemService from "../../../domain/services/system.service";
import BuildSystemSummary from "./buildSystemSummary.use-case";
import { System, SystemSummary, TypeCrearSystem } from "../../../domain/types/system.types";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

const created: System = {
  _id: asId("sys-1"),
  name: "Nuevo",
  description: "",
  publisher: "user-1",
  isOpen: false,
  isBase: true,
  kind: "ruleset",
  parentIds: [],
};

const summary: SystemSummary = {
  id: "sys-1",
  name: "Nuevo",
  description: "",
  publisher: "Alice",
  isOpen: false,
  isBase: true,
  kind: "ruleset",
  parentIds: [],
  canEdit: true,
  racesCount: 0,
  deletedAt: null,
};

const createInput: TypeCrearSystem = {
  name: "Nuevo",
  description: "",
  publisher: "user-1",
  isOpen: false,
  isBase: true,
};

describe("CreateSystem", () => {
  it("returns SystemSummary after persisting", async () => {
    const systemService = {
      create: vi.fn().mockResolvedValue(created),
    } as unknown as SystemService;
    const buildSystemSummary = {
      execute: vi.fn().mockResolvedValue(summary),
    } as unknown as BuildSystemSummary;

    const useCase = new CreateSystem(systemService, buildSystemSummary);
    const result = await useCase.execute(createInput);

    expect(systemService.create).toHaveBeenCalledWith(createInput);
    expect(buildSystemSummary.execute).toHaveBeenCalledWith(created, "user-1");
    expect(result).toEqual(summary);
  });

  it("returns null when create does not persist", async () => {
    const systemService = {
      create: vi.fn().mockResolvedValue(null),
    } as unknown as SystemService;
    const buildSystemSummary = {
      execute: vi.fn(),
    } as unknown as BuildSystemSummary;

    const useCase = new CreateSystem(systemService, buildSystemSummary);

    await expect(useCase.execute(createInput)).resolves.toBeNull();
    expect(buildSystemSummary.execute).not.toHaveBeenCalled();
  });
});

describe("UpdateSystem", () => {
  it("returns SystemSummary after updating", async () => {
    const systemService = {
      update: vi.fn().mockResolvedValue(created),
    } as unknown as SystemService;
    const buildSystemSummary = {
      execute: vi.fn().mockResolvedValue(summary),
    } as unknown as BuildSystemSummary;

    const useCase = new UpdateSystem(systemService, buildSystemSummary);
    const result = await useCase.execute({ id: "sys-1", userId: "user-1", name: "Nuevo" });

    expect(systemService.update).toHaveBeenCalledWith({ id: "sys-1", userId: "user-1", name: "Nuevo" });
    expect(buildSystemSummary.execute).toHaveBeenCalledWith(created, "user-1");
    expect(result).toEqual(summary);
  });
});
