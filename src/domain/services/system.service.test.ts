import { describe, it, expect, vi, beforeEach } from "vitest";
import SystemService from "./system.service";
import ISystemRepository from "../repositories/ISystemRepository";
import { AppError } from "../errors/AppError";
import { System, TypeCrearSystem } from "../types/system.types";
import { parentIdStrings } from "./systemHierarchy";

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
    parentIds: [],
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
    getByIds: vi.fn(),
    getAncestry: vi.fn(),
    getChildren: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    hasChildren: vi.fn(),
  };

  let service: SystemService;

  beforeEach(() => {
    vi.clearAllMocks();
    repository.hasChildren.mockResolvedValue(false);
    repository.getChildren.mockResolvedValue([]);
    repository.getByIds.mockResolvedValue([]);
    repository.create.mockImplementation(async (data: TypeCrearSystem) =>
      makeSystem("created", { kind: data.kind, publisher: data.publisher, isBase: data.isBase, parentIds: data.parentIds as System["parentIds"] })
    );
    repository.update.mockImplementation(async (data: { id: string }) => makeSystem(data.id));
    repository.getAncestry.mockImplementation(async (id: string) => {
      const seen = new Set<string>();
      const result: System[] = [];
      const queue = [id];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (seen.has(currentId)) continue;
        seen.add(currentId);
        const node = await repository.getById(currentId);
        if (!node) continue;
        result.push(node);
        queue.push(...parentIdStrings(node.parentIds));
      }
      return result;
    });
    service = new SystemService(repository as unknown as ISystemRepository);
  });

  it("creates a setting that inherits an open ruleset", async () => {
    repository.getById.mockResolvedValue(makeSystem("rules", { publisher: "other", isOpen: true, isBase: true }));

    await service.create({
      ...baseCreate,
      kind: "setting",
      parentIds: ["rules"],
    });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      kind: "setting",
      parentIds: ["rules"],
    }));
  });

  it("rejects a setting without parentIds", async () => {
    await expect(service.create({ ...baseCreate, kind: "setting" })).rejects.toBeInstanceOf(AppError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("forces isBase on a ruleset without parents", async () => {
    await service.create({ ...baseCreate, kind: "ruleset", isBase: true, parentIds: [] });

    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({
      isBase: true,
      parentIds: [],
    }));
  });

  it("rejects isBase false on a root", async () => {
    await expect(service.create({ ...baseCreate, kind: "ruleset", isBase: false, parentIds: [] }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a ruleset whose parent is a setting", async () => {
    repository.getById.mockResolvedValue(makeSystem("setting", { kind: "setting", isOpen: true, isBase: false, parentIds: [asId("rules")] }));

    await expect(service.create({
      ...baseCreate,
      kind: "ruleset",
      parentIds: ["setting"],
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a parent of kind campaign", async () => {
    repository.getById.mockResolvedValue(makeSystem("layer", { kind: "campaign", isOpen: true }));

    await expect(service.create({
      ...baseCreate,
      kind: "setting",
      parentIds: ["layer"],
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects a parent cycle", async () => {
    const child = makeSystem("child", { parentIds: [asId("parent")] });
    const parent = makeSystem("parent", { parentIds: [asId("child")], isBase: true });
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "child") return child;
      if (id === "parent") return parent;
      return null;
    });

    await expect(service.update({
      id: "child",
      userId: "user-1",
      parentIds: ["parent"],
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
      parentIds: ["rules"],
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects stored formulas when a ruleset becomes a setting", async () => {
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "home") return makeSystem("home", { kind: "ruleset", maxLevel: 20 });
      if (id === "rules") return makeSystem("rules", { isBase: true, isOpen: true });
      return null;
    });

    await expect(service.update({
      id: "home",
      userId: "user-1",
      kind: "setting",
      parentIds: ["rules"],
    })).rejects.toMatchObject({ statusCode: 400 });

    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects formula fields on a setting", async () => {
    await expect(service.create({
      ...baseCreate,
      kind: "setting",
      parentIds: ["rules"],
      maxLevel: 20,
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("rejects inheriting a closed system from another publisher", async () => {
    repository.getById.mockResolvedValue(makeSystem("rules", { publisher: "other", isOpen: false, isBase: true }));

    await expect(service.create({
      ...baseCreate,
      parentIds: ["rules"],
    })).rejects.toMatchObject({ statusCode: 403 });
  });

  it("rejects turning a system with children into a campaign layer", async () => {
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "rules") return makeSystem("rules", { kind: "ruleset", isOpen: true, isBase: true });
      if (id === "home") return makeSystem("home", { kind: "ruleset", parentIds: [asId("rules")] });
      return null;
    });
    repository.hasChildren.mockResolvedValue(true);

    await expect(service.update({
      id: "home",
      userId: "user-1",
      kind: "campaign",
      parentIds: ["rules"],
    })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("revalidates descendants when marking an intermediate node as base", async () => {
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "nucleo") return makeSystem("nucleo", { isBase: true });
      if (id === "a") return makeSystem("a", { parentIds: [asId("nucleo")] });
      if (id === "b") return makeSystem("b", { parentIds: [asId("nucleo")], isBase: true });
      if (id === "g") return makeSystem("g", { parentIds: [asId("a"), asId("b")] });
      return null;
    });
    repository.getChildren.mockImplementation(async (id: string) => {
      if (id === "a") return [makeSystem("g", { parentIds: [asId("a"), asId("b")] })];
      return [];
    });

    await expect(service.update({
      id: "a",
      userId: "user-1",
      isBase: true,
    })).rejects.toMatchObject({ statusCode: 400 });
    expect(repository.update).not.toHaveBeenCalled();
  });

  it("rejects character systems with two most specific bases", async () => {
    repository.getByIds.mockResolvedValue([
      makeSystem("srd51", { isBase: true, parentIds: [asId("nucleo")] }),
      makeSystem("srd52", { isBase: true, parentIds: [asId("nucleo")] }),
    ]);
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "nucleo") return makeSystem("nucleo", { isBase: true });
      if (id === "srd51") return makeSystem("srd51", { isBase: true, parentIds: [asId("nucleo")] });
      if (id === "srd52") return makeSystem("srd52", { isBase: true, parentIds: [asId("nucleo")] });
      return null;
    });

    await expect(service.assertSingleBase(["srd51", "srd52"])).rejects.toMatchObject({ statusCode: 400 });
  });

  it("accepts character systems that share a single Núcleo engine", async () => {
    repository.getByIds.mockResolvedValue([
      makeSystem("phb", { parentIds: [asId("nucleo")] }),
      makeSystem("mm", { parentIds: [asId("nucleo")] }),
    ]);
    repository.getById.mockImplementation(async (id: string) => {
      if (id === "nucleo") return makeSystem("nucleo", { isBase: true });
      if (id === "phb") return makeSystem("phb", { parentIds: [asId("nucleo")] });
      if (id === "mm") return makeSystem("mm", { parentIds: [asId("nucleo")] });
      return null;
    });

    await expect(service.assertSingleBase(["phb", "mm"])).resolves.toBeUndefined();
  });
});
