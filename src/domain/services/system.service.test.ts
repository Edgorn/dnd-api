import { describe, it, expect, vi, beforeEach } from "vitest";
import SystemService from "./system.service";
import ISystemRepository from "../repositories/ISystemRepository";
import { AppError } from "../errors/AppError";
import { System, TypeCrearSystem } from "../types/system.types";

function asId(id: string): System["_id"] {
  return { toString: () => id } as System["_id"];
}

function makeSystem(id: string, overrides: Partial<System> = {}): System {
  return {
    _id: asId(id),
    name: id,
    description: "",
    publisher: "user-1",
    isOpen: true,
    isBase: false,
    kind: "ruleset",
    ...overrides,
  };
}

const baseCreate: TypeCrearSystem = {
  name: "Capa",
  description: "",
  publisher: "user-1",
  isOpen: false,
  isBase: false,
};

describe("SystemService hierarchy", () => {
  const repository = {
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    hasChildren: vi.fn(),
  };

  let service: SystemService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository.hasChildren.mockResolvedValue(false);
    repository.create.mockImplementation(async (data: TypeCrearSystem) =>
      makeSystem("created", { kind: data.kind, publisher: data.publisher, isBase: data.isBase })
    );
    repository.update.mockImplementation(async (data: { id: string }) => makeSystem(data.id));
    service = new SystemService(repository as unknown as ISystemRepository);
  });

  it("creates a setting that inherits an open ruleset", async () => {
    repository.getById.mockResolvedValue(makeSystem("rules", { publisher: "other", isOpen: true }));

    await service.create({
      ...baseCreate,
      kind: "setting",
      parentId: "rules",
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      kind: "setting",
      parentId: "rules",
    }));
  });

  it("rejects a setting without parentId", async () => {
    await expect(service.create({ ...baseCreate, kind: "setting" })).rejects.toBeInstanceOf(AppError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("rejects a ruleset whose parent is a setting", async () => {
    repository.getById.mockResolvedValue(makeSystem("setting", { kind: "setting", isOpen: true }));

    await expect(service.create({
      ...baseCreate,
      kind: "ruleset",
      parentId: "setting",
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a parent of kind campaign", async () => {
    repository.getById.mockResolvedValue(makeSystem("layer", { kind: "campaign", isOpen: true }));

    await expect(service.create({
      ...baseCreate,
      kind: "setting",
      parentId: "layer",
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a parent cycle", async () => {
    const child = makeSystem("child", { parentId: asId("parent") });
    const parent = makeSystem("parent", { parentId: asId("child") });
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "child") return child;
      if (id === "parent") return parent;
      return null;
    });

    await expect(service.update({
      id: "child",
      userId: "user-1",
      parentId: "parent",
    })).rejects.toMatchObject({
      statusCode: 400,
      message: "La jerarquía de sistemas no puede contener ciclos",
    });
  });

  it("rejects isBase on a setting", async () => {
    await expect(service.create({
      ...baseCreate,
      kind: "setting",
      isBase: true,
      parentId: "rules",
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects stored formulas when a ruleset becomes a setting", async () => {
    repository.getById.mockResolvedValue(makeSystem("home", { kind: "ruleset", maxLevel: 20 }));

    await expect(service.update({
      id: "home",
      userId: "user-1",
      kind: "setting",
      parentId: "rules",
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects formula fields on a setting", async () => {
    await expect(service.create({
      ...baseCreate,
      kind: "setting",
      parentId: "rules",
      maxLevel: 20,
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects inheriting a closed system from another publisher", async () => {
    repository.getById.mockResolvedValue(makeSystem("rules", { publisher: "other", isOpen: false }));

    await expect(service.create({
      ...baseCreate,
      parentId: "rules",
    })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects turning a system with children into a campaign layer", async () => {
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "rules") return makeSystem("rules", { kind: "ruleset", isOpen: true });
      if (id === "home") return makeSystem("home", { kind: "ruleset", parentId: asId("rules") });
      return null;
    });
    repository.hasChildren.mockResolvedValue(true);

    await expect(service.update({
      id: "home",
      userId: "user-1",
      kind: "campaign",
      parentId: "rules",
    })).rejects.toMatchObject({ statusCode: 400 });
  });
});
